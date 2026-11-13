import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const supabase = createAdminClient();

  try {
    const { data } = await supabase
      .from('connected_accounts')
      .select('id, workspace_id, account_name, platform')
      .eq('id', id)
      .single();

    const account = data as any;
    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    // Cascade delete destinations and account tokens
    const { error } = await supabase.from('connected_accounts').delete().eq('id', id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Audit log
    await (supabase.from('audit_logs') as any).insert({
      workspace_id: account.workspace_id,
      action: 'account.disconnected',
      resource_type: 'connected_account',
      resource_id: id,
      metadata: {
        accountName: account.account_name,
        platform: account.platform,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Account ${account.account_name} disconnected and credentials purged`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
