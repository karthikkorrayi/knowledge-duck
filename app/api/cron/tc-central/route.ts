import { NextRequest, NextResponse } from 'next/server';
import { scrapeTeluguCareersState } from '@/automation/scrapers/telugucareers';
import { normalizeJobs } from '@/automation/saveJobs';
import { upsertJobs } from '@/automation/services/supabaseInsert';

export const maxDuration = 10;

export async function GET(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret')
               ?? req.nextUrl.searchParams.get('secret');
  if (secret !== process.env.CRON_SECRET)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const jobs = await scrapeTeluguCareersState('CENTRAL');
    const saved = await upsertJobs(normalizeJobs(jobs));
    return NextResponse.json({ success: true, scraped: jobs.length, saved });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}