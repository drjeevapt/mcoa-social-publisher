import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createPostSchema, validatePostForPlatforms } from '@/lib/validation/post-validation';
import { generateIdempotentKey } from '@/lib/crypto';
import { executePostPublishing } from '@/lib/queue/publisher-worker';

export async function GET(req: NextRequest) {
  const supabase = createAdminClient();
  const searchParams = req.nextUrl.searchParams;
  const workspaceId = searchParams.get('workspaceId') || 'a0000000-0000-0000-0000-000000000001';
  const status = searchParams.get('status');

  let query = supabase
    .from('posts')
    .select(`
      *,
      post_destinations (
        id,
        destination_id,
        platform,
        custom_caption,
        status,
        platform_post_id,
        platform_permalink,
        error_code,
        error_message,
        attempts,
        last_attempted_at,
        uncertain_outcome,
        connected_destinations (
          destination_name,
          destination_type
        )
      )
    `)
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status as any);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ posts: data });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = createPostSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input data', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const {
      workspaceId,
      baseCaption,
      mediaUrl,
      mediaType,
      mediaSizeBytes,
      destinations,
      scheduleType,
      scheduledAt,
    } = parsed.data;

    // Validate platform constraints
    const validation = validatePostForPlatforms(
      baseCaption,
      destinations,
      mediaType,
      mediaSizeBytes
    );

    if (!validation.isValid) {
      return NextResponse.json(
        { error: 'Post validation failed for target platforms', details: validation.errors },
        { status: 422 }
      );
    }

    const supabase = createAdminClient();

    // Determine initial post status
    let initialStatus: 'draft' | 'scheduled' | 'publishing' = 'draft';
    let scheduleTimestamp: string | null = null;

    if (scheduleType === 'schedule') {
      if (!scheduledAt) {
        return NextResponse.json({ error: 'scheduledAt is required for scheduled posts' }, { status: 400 });
      }
      initialStatus = 'scheduled';
      scheduleTimestamp = scheduledAt;
    } else if (scheduleType === 'now') {
      initialStatus = 'publishing';
    }

    // 1. Insert post record
    const { data: post, error: postErr } = await (supabase
      .from('posts') as any)
      .insert({
        workspace_id: workspaceId,
        base_caption: baseCaption,
        media_url: mediaUrl,
        media_type: mediaType,
        media_size_bytes: mediaSizeBytes || null,
        status: initialStatus,
        scheduled_at: scheduleTimestamp,
      })
      .select()
      .single();

    if (postErr || !post) {
      return NextResponse.json({ error: `Failed to create post: ${postErr?.message}` }, { status: 500 });
    }

    // 2. Insert post destinations
    const destInserts = destinations.map((d) => ({
      post_id: post.id,
      workspace_id: workspaceId,
      destination_id: d.destinationId,
      platform: d.platform,
      custom_caption: d.customCaption && d.customCaption.trim() !== '' ? d.customCaption : null,
      status: (scheduleType === 'schedule' ? 'scheduled' : 'pending') as any,
      idempotent_key: generateIdempotentKey(post.id, d.destinationId),
    }));

    const { error: destErr } = await (supabase.from('post_destinations') as any).insert(destInserts);
    if (destErr) {
      // Clean up post
      await supabase.from('posts').delete().eq('id', post.id);
      return NextResponse.json({ error: `Failed to assign destinations: ${destErr.message}` }, { status: 500 });
    }

    // 3. Log audit action
    await (supabase.from('audit_logs') as any).insert({
      workspace_id: workspaceId,
      action: scheduleType === 'now' ? 'post.published_now' : scheduleType === 'schedule' ? 'post.scheduled' : 'post.draft_saved',
      resource_type: 'post',
      resource_id: post.id,
      metadata: {
        destinationCount: destinations.length,
        scheduleType,
        scheduledAt,
      },
    });

    // 4. If publish 'now', execute publishing immediately
    let executionResult = null;
    if (scheduleType === 'now') {
      try {
        executionResult = await executePostPublishing(post.id);
      } catch (execErr: any) {
        console.error('[Publish Now Error]:', execErr);
      }
    }

    return NextResponse.json({
      success: true,
      post,
      executionResult,
    });
  } catch (err: any) {
    console.error('[Create Post API Error]:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
