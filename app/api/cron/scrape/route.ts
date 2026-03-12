// Next.js App Router Route Handler used as a cron endpoint.
//
// HOW TO TRIGGER:
//   Option A – Vercel Cron (vercel.json):
//     {"crons": [{"path": "/api/cron/scrape", "schedule": "0 */6 * * *"}]}
//     Every 6 hours: 12AM, 6AM, 12PM, 6PM IST
//
//   Option B – External cron service (cron-job.org, EasyCron):
//     GET https://yourdomain.com/api/cron/scrape
//     Add header: Authorization: Bearer <CRON_SECRET>
//
//   Option C – GitHub Actions (.github/workflows/scrape.yml)
//     schedule: "0 */6 * * *"
//     run: curl -X GET https://yourdomain.com/api/cron/scrape \
//          -H "Authorization: Bearer $CRON_SECRET"

import { NextRequest, NextResponse } from 'next/server';
import { runAllScrapers } from '@/automation/runScrapers';

// Protect with a secret so random people can't trigger your scraper
const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(req: NextRequest) {
  // Verify secret (skip in development)
  if (process.env.NODE_ENV === 'production' && CRON_SECRET) {
    const auth = req.headers.get('Authorization') ?? req.nextUrl.searchParams.get('secret');
    if (auth !== `Bearer ${CRON_SECRET}` && auth !== CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const startTime = Date.now();
  console.log('[cron/scrape] Starting scheduled scrape…');

  try {
    const reports = await runAllScrapers();

    const summary = reports.map((r) => ({
      scraper:     r.scraperName,
      scraped:     r.jobsScraped,
      saved:       r.jobsSaved,
      exams:       r.examsSaved,
      durationMs:  r.durationMs,
      errors:      r.errors,
    }));

    return NextResponse.json({
      success: true,
      durationMs: Date.now() - startTime,
      reports: summary,
    });
  } catch (err) {
    console.error('[cron/scrape] Fatal:', err);
    return NextResponse.json(
      { success: false, error: String(err) },
      { status: 500 },
    );
  }
}