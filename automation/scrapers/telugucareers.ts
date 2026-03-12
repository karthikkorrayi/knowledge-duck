// Scrapes telugucareers.com — dedicated AP/TS/Central jobs source.
// Because we scrape each state's category page directly, we set
// forcedState on every job so classifyState() is skipped entirely.
//
// Category URLs:
//   AP      → /category/state-govt-jobs/andhrapradesh/
//   TS      → /category/state-govt-jobs/telangana/
//   CENTRAL → /category/central-govt-jobs/

import * as cheerio from 'cheerio';
import type { ScraperResult, RawJob, JobState } from '../types';

const BASE_URL = 'https://www.telugucareers.com';

const STATE_PAGES: { state: JobState; url: string }[] = [
  { state: 'AP',      url: `${BASE_URL}/category/state-govt-jobs/andhrapradesh/` },
  { state: 'TS',      url: `${BASE_URL}/category/state-govt-jobs/telangana/` },
  { state: 'CENTRAL', url: `${BASE_URL}/category/central-govt-jobs/` },
];

const MAX_ARTICLES_PER_STATE = 15;
const POLITE_DELAY = 700;

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
    '(KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Accept':          'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Referer':         BASE_URL,
};

// ── Fetch with retry ──────────────────────────────────────────────
async function fetchPage(url: string, retries = 3): Promise<string> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, { headers: HEADERS });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    } catch (err) {
      if (attempt === retries) throw err;
      await sleep(2000 * attempt);
    }
  }
  throw new Error(`Failed after ${retries} retries: ${url}`);
}

function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

// ── Step 1: extract article links from listing page ────────────────
function extractArticleLinks(html: string): string[] {
  const $ = cheerio.load(html);
  const links = new Set<string>();
  // WordPress dated URLs: /YYYY/MM/DD/slug/
  $('h2 a, h3 a, .entry-title a, article a[href]').each((_i, el) => {
    const href = $(el).attr('href') ?? '';
    if (href.startsWith(BASE_URL) && /\/\d{4}\/\d{2}\/\d{2}\//.test(href)) {
      links.add(href);
    }
  });
  return Array.from(links);
}

// ── Step 2: parse article detail page ─────────────────────────────
function parseArticle(html: string, sourceUrl: string, forcedState: JobState): RawJob | null {
  const $ = cheerio.load(html);

  // Title — strip Telugu and clean prefixes like "Govt Jobs 2026 :"
  let title = $('h1').first().text().trim();
  title = title
    .replace(/[^\x00-\x7F|]+/g, ' ')   // remove Telugu chars
    .replace(/\s+/g, ' ')
    .replace(/^Govt\s*Jobs?\s*[\d]*\s*[:\-|]\s*/i, '')
    .replace(/^[\d]+\s*[:\-|]\s*/, '')
    .trim();

  if (!title || title.length < 5) return null;

  // Build key→value from tables
  const tableData: Record<string, string> = {};
  $('table tr').each((_i, row) => {
    const cells = $(row).find('td, th');
    if (cells.length >= 2) {
      const rawKey = $(cells[0]).text().replace(/[^\x00-\x7F]/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
      const val    = $(cells[1]).text().replace(/\s+/g, ' ').trim();
      if (rawKey && val) tableData[rawKey] = val;
    }
  });

  // Organization
  const orgRaw =
    tableData['organization name'] ??
    tableData['organization'] ??
    tableData['board name'] ??
    tableData['department'] ??
    tableData['authority'] ??
    $('strong, b').first().text().replace(/[^\x00-\x7F]+/g, '').trim();

  const org = (orgRaw || title.split(/\d/)[0])
    .replace(/[^\x00-\x7F]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 200);

  // Vacancies
  const vacRaw =
    tableData['total vacancies'] ??
    tableData['total posts'] ??
    tableData['no. of posts'] ??
    tableData['vacancies'] ??
    tableData['posts'];
  const vacancies = vacRaw
    ? parseInt(vacRaw.replace(/[^0-9]/g, ''), 10) || extractVacancyFromTitle(title)
    : extractVacancyFromTitle(title);

  // Dates
  const lastDate  = tableData['apply last date'] ?? tableData['last date'] ?? tableData['closing date'];
  const examDate  = tableData['exam date'] ?? tableData['written exam date'];

  // Links
  const applyLink  = $('a:contains("Apply Online"), a:contains("Apply Now"), a:contains("Official Website")')
    .not(`[href*="telugucareers"]`).first().attr('href') ?? undefined;
  const notifLink  = $('a[href$=".pdf"], a:contains("Notification"), a:contains("Official Notification")')
    .first().attr('href') ?? undefined;

  // Notification date from URL
  const dm = sourceUrl.match(/\/(\d{4})\/(\d{2})\/(\d{2})\//);
  const notificationDate = dm ? `${dm[1]}-${dm[2]}-${dm[3]}` : undefined;

  return {
    title:             title.slice(0, 200),
    organization:      org || title.slice(0, 200),
    notificationDate,
    lastDate,
    examDate,
    applyLink,
    notificationLink:  notifLink,
    sourceUrl,
    vacancies,
    source:            'telugucareers',
    forcedState,        // ← key fix: tells normalizeJobs to skip keyword classification
  };
}

function extractVacancyFromTitle(title: string): number | undefined {
  const m = title.match(/(\d[\d,]+)\s*(?:posts?|vacancies|seats)/i);
  return m ? parseInt(m[1].replace(/,/g, ''), 10) : undefined;
}

// ── Scrape one state category ──────────────────────────────────────
async function scrapeStateCategory(state: JobState, categoryUrl: string): Promise<RawJob[]> {
  console.log(`\n[telugucareers] Scraping ${state} → ${categoryUrl}`);

  let html: string;
  try { html = await fetchPage(categoryUrl); }
  catch (err) { console.error(`[telugucareers] Failed ${state}:`, err); return []; }

  const links = extractArticleLinks(html).slice(0, MAX_ARTICLES_PER_STATE);
  console.log(`[telugucareers] ${state}: found ${links.length} articles`);

  const jobs: RawJob[] = [];
  for (let i = 0; i < links.length; i++) {
    try {
      const pageHtml = await fetchPage(links[i]);
      const job = parseArticle(pageHtml, links[i], state);
      if (job) {
        jobs.push(job);
        process.stdout.write(`\r[telugucareers] ${state} ${i + 1}/${links.length}: ${job.title.slice(0, 50)}…`);
      }
    } catch (err) {
      console.warn(`\n[telugucareers] Skip ${links[i]}: ${err}`);
    }
    if (i < links.length - 1) await sleep(POLITE_DELAY);
  }

  console.log(`\n[telugucareers] ${state}: saved ${jobs.length} jobs`);
  return jobs;
}

// ── Main export ────────────────────────────────────────────────────
export async function scrapeTeluguCareers(): Promise<ScraperResult> {
  const allJobs: RawJob[] = [];

  for (const { state, url } of STATE_PAGES) {
    const jobs = await scrapeStateCategory(state, url);
    allJobs.push(...jobs);
    await sleep(2000); // polite pause between categories
  }

  console.log(`\n[telugucareers] Total scraped: ${allJobs.length} jobs`);
  return { jobs: allJobs, exams: [] };
}