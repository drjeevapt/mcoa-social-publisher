import { NextRequest, NextResponse } from 'next/server';
import { processDueScheduledPosts } from '@/lib/queue/publisher-worker';

export async function GET(req: NextRequest) {
  // Validate cron secret to prevent unauthorized execution
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret) {
    if (authHeader !== `Bearer ${cronSecret}`) {
      const urlSecret = req.nextUrl.searchParams.get('secret');
      if (urlSecret !== cronSecret) {
        return NextResponse.json({ error: 'Unauthorized cron request' }, { status: 401 });
      }
    }
  }

  try {
    const results = await processDueScheduledPosts();
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      processedCount: results.length,
      results,
    });
  } catch (error: any) {
    console.error('[API Cron Error]:', error);
    return NextResponse.json(
      { error: error.message || 'Worker sweep failed' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  return GET(req);
}
