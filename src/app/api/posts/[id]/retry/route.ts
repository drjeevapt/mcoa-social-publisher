import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { executePostPublishing } from '@/lib/queue/publisher-worker';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const supabase = createAdminClient();

  try {
    const body = await req.json().catch(() => ({}));
    const requestedDestinationIds: string[] | undefined = body.destinationIds;

    // Fetch destinations for this post
    const { data, error } = await supabase
      .from('post_destinations')
      .select('id, destination_id, status, platform')
      .eq('post_id', id);

    const destinations = (data as any[]) || [];

    if (error || destinations.length === 0) {
      return NextResponse.json({ error: 'No destinations found for post' }, { status: 404 });
    }

    // Filter to ONLY destinations that are not already published!
    let targetDestinations = destinations.filter((d: any) => d.status !== 'published');

    if (requestedDestinationIds && requestedDestinationIds.length > 0) {
      targetDestinations = targetDestinations.filter((d) =>
        requestedDestinationIds.includes(d.destination_id)
      );
    }

    if (targetDestinations.length === 0) {
      return NextResponse.json({
        message: 'All requested destinations are already published. No retry needed.',
        success: true,
        skippedAll: true,
      });
    }

    const targetDestinationIds = targetDestinations.map((d) => d.destination_id);

    // Audit log
    const { data: postData } = await supabase.from('posts').select('workspace_id').eq('id', id).single();
    const post = postData as any;
    if (post) {
      await (supabase.from('audit_logs') as any).insert({
        workspace_id: post.workspace_id,
        action: 'post.retry_requested',
        resource_type: 'post',
        resource_id: id,
        metadata: {
          retryingDestinationIds: targetDestinationIds,
        },
      });
    }

    // Execute publishing for ONLY the failed destinations
    const result = await executePostPublishing(id, targetDestinationIds);

    return NextResponse.json({
      success: true,
      message: `Retried ${targetDestinationIds.length} destinations`,
      result,
    });
  } catch (err: any) {
    console.error('[Retry API Error]:', err);
    return NextResponse.json({ error: err.message || 'Retry failed' }, { status: 500 });
  }
}
