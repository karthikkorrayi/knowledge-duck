// Loads env vars FIRST, then runs all scrapers

import path from 'path';

const envFiles = ['.env.local', '.env'];
for (const file of envFiles) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const dotenv = require('dotenv');
    const result = dotenv.config({ path: path.resolve(process.cwd(), file), override: false });
    if (!result.error) console.log(`[env] Loaded ${file}`);
  } catch { /* dotenv not installed */ }
}

import { scrapeFreeJobAlert }  from './scrapers/freejobalert';
import { scrapeTeluguCareers } from './scrapers/telugucareers';
import { normalizeJobs, normalizeExams } from './saveJobs';
import { upsertJobs, upsertExams, markStaleJobsInactive } from './services/supabaseInsert';
import type { RunReport } from './types';

// ──────────────────────────────────────────────
// Run a single scraper and save results
// ──────────────────────────────────────────────

async function runScraper(
  name: string,
  scraperFn: () => Promise<{ jobs: import('./types').RawJob[]; exams: import('./types').RawExam[] }>,
): Promise<RunReport> {
  const start = Date.now();
  const errors: string[] = [];

  try {
    const { jobs: rawJobs, exams: rawExams } = await scraperFn();

    const normalJobs  = normalizeJobs(rawJobs);
    const normalExams = normalizeExams(rawExams);

    // Breakdown by state
    const byState = normalJobs.reduce<Record<string, number>>((acc, j) => {
      acc[j.state] = (acc[j.state] ?? 0) + 1;
      return acc;
    }, {});

    console.log(`[${name}] After filter: ${normalJobs.length} jobs — ${JSON.stringify(byState)}`);

    const jobsSaved  = await upsertJobs(normalJobs);
    const examsSaved = await upsertExams(normalExams);

    console.log(`[${name}] Saved: ${jobsSaved} jobs, ${examsSaved} exams`);

    return {
      scraperName: name,
      jobsScraped: rawJobs.length,
      jobsSaved,
      examsSaved,
      errors,
      durationMs: Date.now() - start,
    };
  } catch (err) {
    errors.push(String(err));
    console.error(`[${name}] Fatal:`, err);
    return { scraperName: name, jobsScraped: 0, jobsSaved: 0, examsSaved: 0, errors, durationMs: Date.now() - start };
  }
}

// ──────────────────────────────────────────────
// Main
// ──────────────────────────────────────────────

export async function runAllScrapers(): Promise<RunReport[]> {
  const reports: RunReport[] = [];

  // 1. FreeJobAlert — Central + All India jobs
  console.log('\n═══════════ FreeJobAlert (Central / All India) ═══════════');
  reports.push(await runScraper('freejobalert', scrapeFreeJobAlert));

  // 2. TeluguCareers — AP + TS + Central dedicated
  console.log('\n═══════════ TeluguCareers (AP + TS + Central) ═══════════');
  reports.push(await runScraper('telugucareers', scrapeTeluguCareers));

  // 3. Cleanup stale jobs
  try {
    await markStaleJobsInactive(90);
    console.log('\n[cleanup] Stale jobs (>90 days) marked inactive');
  } catch (err) {
    console.warn('[cleanup] Failed:', err);
  }

  return reports;
}

// CLI: npx ts-node automation/runScrapers.ts
if (require.main === module) {
  runAllScrapers()
    .then((reports) => {
      console.log('\n════════════════ Run Report ════════════════');
      let totalSaved = 0;
      for (const r of reports) {
        const icon = r.errors.length ? '❌' : '✅';
        console.log(
          `${icon} ${r.scraperName.padEnd(16)}: scraped=${String(r.jobsScraped).padStart(3)}  ` +
          `saved=${String(r.jobsSaved).padStart(3)}  exams=${r.examsSaved}  ` +
          `duration=${(r.durationMs / 1000).toFixed(1)}s`,
        );
        if (r.errors.length) r.errors.forEach((e) => console.error(`   ⚠ ${e}`));
        totalSaved += r.jobsSaved;
      }
      console.log(`────────────────────────────────────────────`);
      console.log(`   Total jobs saved this run: ${totalSaved}`);
      console.log(`════════════════════════════════════════════`);
    })
    .catch(console.error);
}