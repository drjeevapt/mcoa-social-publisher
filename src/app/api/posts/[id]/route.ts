import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createAdminClient();
  const { id } = params;

  const { data: post, error } = await supabase
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
        error_details,
        attempts,
        last_attempted_at,
        uncertain_outcome,
        connected_destinations (
          destination_name,
          destination_type,
          platform_destination_id
        )
      )
    `)
    .eq('id', id)
    .single();

  if (error || !post) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 });
  }

  return NextResponse.json({ post });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createAdminClient();
  const { id } = params;

  // Check post status first
  const { data } = await supabase.from('posts').select('status, workspace_id').eq('id', id).single();
  const post = data as any;
  if (!post) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 });
  }

  if (post.status === 'publishing') {
    return NextResponse.json({ error: 'Cannot delete a post currently being published' }, { status: 400 });
  }

  const { error } = await supabase.from('posts').delete().eq('id', id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await (supabase.from('audit_logs') as any).insert({
    workspace_id: post.workspace_id,
    action: 'post.deleted',
    resource_type: 'post',
    resource_id: id,
  });

  return NextResponse.json({ success: true, message: 'Post deleted successfully' });
}
