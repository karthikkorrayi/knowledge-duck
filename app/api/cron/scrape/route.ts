import { NextRequest, NextResponse } from 'next/server';
import { runAllScrapers } from '@/automation/runScrapers';

export const maxDuration = 300; // 5 minutes max

export async function GET(req: NextRequest) {
  // Verify the secret — reject anyone without it
  const secret = req.headers.get('x-cron-secret') 
               ?? req.nextUrl.searchParams.get('secret');
  
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json(
      { error: 'Unauthorized' }, 
      { status: 401 }
    );
  }

  try {
    console.log('[cron] Scrape started');
    const report = await runAllScrapers();
    console.log('[cron] Scrape complete:', report);
    return NextResponse.json({ success: true, report });
  } catch (err) {
    console.error('[cron] Scrape failed:', err);
    return NextResponse.json(
      { error: String(err) }, 
      { status: 500 }
    );
  }
}