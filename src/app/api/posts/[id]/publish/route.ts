import { NextRequest, NextResponse } from 'next/server';
import { executePostPublishing } from '@/lib/queue/publisher-worker';

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  try {
    const result = await executePostPublishing(id);
    return NextResponse.json({
      success: true,
      message: 'Post publish sequence executed',
      result,
    });
  } catch (err: any) {
    console.error('[Publish Post API Error]:', err);
    return NextResponse.json({ error: err.message || 'Publishing execution failed' }, { status: 500 });
  }
}
