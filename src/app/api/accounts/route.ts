import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(req: NextRequest) {
  const supabase = createAdminClient();
  const searchParams = req.nextUrl.searchParams;
  const workspaceId = searchParams.get('workspaceId') || 'a0000000-0000-0000-0000-000000000001';

  try {
    const { data: accounts, error: accErr } = await supabase
      .from('connected_accounts')
      .select(`
        id,
        platform,
        account_name,
        account_email,
        profile_picture_url,
        token_expires_at,
        status,
        status_message,
        scopes,
        metadata,
        created_at,
        updated_at,
        connected_destinations (
          id,
          platform,
          destination_type,
          destination_name,
          platform_destination_id,
          is_enabled,
          requires_approval,
          approval_status,
          metadata
        )
      `)
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });

    if (accErr) {
      return NextResponse.json({ error: accErr.message }, { status: 500 });
    }

    return NextResponse.json({ accounts: accounts || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
