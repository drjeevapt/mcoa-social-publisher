import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function PATCH(req: NextRequest) {
  const supabase = createAdminClient();

  try {
    const { destinationId, isEnabled } = await req.json();

    if (!destinationId || typeof isEnabled !== 'boolean') {
      return NextResponse.json({ error: 'destinationId and isEnabled boolean are required' }, { status: 400 });
    }

    const { data, error } = await (supabase
      .from('connected_destinations') as any)
      .update({ is_enabled: isEnabled })
      .eq('id', destinationId)
      .select('id, destination_name, is_enabled, workspace_id')
      .single();

    if (error || !data) {
      return NextResponse.json({ error: error?.message || 'Failed to update destination' }, { status: 500 });
    }

    await (supabase.from('audit_logs') as any).insert({
      workspace_id: data.workspace_id,
      action: isEnabled ? 'destination.enabled' : 'destination.disabled',
      resource_type: 'connected_destination',
      resource_id: destinationId,
      metadata: { destinationName: data.destination_name },
    });

    return NextResponse.json({ success: true, destination: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
