// Strategy (based on actual site structure as of 2026):
//   1. Fetch homepage → extract all /articles/* links from "Job Notifications" section
//   2. For each article, fetch the detail page → parse the data table
//   3. Return normalized RawJob[]
//
// The site does NOT have /latest-jobs/ or /upcoming-exams/ routes.
// All job posts live under /articles/[slug]

import * as cheerio from 'cheerio';
import type { ScraperResult, RawJob } from '../types';

const BASE_URL = 'https://www.freejobalert.com';
const HOME_URL = BASE_URL + '/';

// Max articles to deep-scrape per run (to avoid hammering the server)
const MAX_DETAIL_PAGES = 40;

// Polite delay between detail page requests (ms)
const POLITE_DELAY = 800;

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
    '(KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Cache-Control': 'no-cache',
};

// ──────────────────────────────────────────────
// Fetch with retry + polite delay
// ──────────────────────────────────────────────

async function fetchPage(url: string, retries = 3): Promise<string> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, { headers: HEADERS });
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
      return await res.text();
    } catch (err) {
      if (attempt === retries) throw err;
      const delay = 2000 * attempt;
      console.warn(`[freejobalert] Retry ${attempt}/${retries} for ${url} (${delay}ms)`);
      await sleep(delay);
    }
  }
  throw new Error(`Failed after ${retries} retries: ${url}`);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ──────────────────────────────────────────────
// Step 1: Scrape homepage → extract /articles/* links
// ──────────────────────────────────────────────

function extractArticleLinks(html: string): string[] {
  const $ = cheerio.load(html);
  const links = new Set<string>();

  $('a[href*="/articles/"]').each((_i, el) => {
    const href = $(el).attr('href') ?? '';
    if (href.includes('/articles/') && !href.includes('#')) {
      links.add(href.startsWith('http') ? href : `${BASE_URL}${href}`);
    }
  });

  return Array.from(links);
}

// ──────────────────────────────────────────────
// Step 2: Parse individual article detail page
// ──────────────────────────────────────────────

function parseArticlePage(html: string, sourceUrl: string): RawJob | null {
  const $ = cheerio.load(html);

  // Title: h1
  const title = $('h1').first().text().trim();
  if (!title) return null;

  // Build key→value map from all tables in the article
  const tableData: Record<string, string> = {};

  $('table tr').each((_i, row) => {
    const cells = $(row).find('td, th');
    if (cells.length >= 2) {
      const key   = $(cells[0]).text().replace(/\*+/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
      const value = $(cells[1]).text().replace(/\s+/g, ' ').trim();
      if (key && value) tableData[key] = value;
    }
  });

  // Organization
  const org =
    tableData['organization name'] ??
    tableData['organization'] ??
    tableData['board name'] ??
    tableData['department name'] ??
    tableData['authority'] ??
    $('strong, b').first().text().trim() ??
    title.split(/\d+/)[0].replace(/recruitment|notification/gi, '').trim();

  // Vacancies — parse number out of raw string like "22,195 Posts"
  const vacancyRaw =
    tableData['total vacancies'] ??
    tableData['total posts'] ??
    tableData['no. of posts'] ??
    tableData['vacancies'] ??
    tableData['total no. of posts'] ??
    tableData['number of posts'];

  const vacancies = vacancyRaw
    ? parseInt(vacancyRaw.replace(/[^0-9]/g, ''), 10) || undefined
    : extractVacancyFromTitle(title);

  // Dates
  const lastDate =
    tableData['apply last date'] ??
    tableData['last date to apply'] ??
    tableData['last date'] ??
    tableData['closing date'] ??
    tableData['end date'] ??
    tableData['application last date'];

  const startDate =
    tableData['apply start date'] ??
    tableData['start date'] ??
    tableData['opening date'];

  const examDate =
    tableData['exam date'] ??
    tableData['written exam date'] ??
    tableData['tentative exam date'];

  // Links: prefer non-freejobalert.com links for apply/notification
  const applyLink =
    $('a:contains("Apply Online"), a:contains("Apply Now"), a:contains("Online Application")')
      .not('[href*="freejobalert"]')
      .first()
      .attr('href') ?? undefined;

  const notifLink =
    $('a[href$=".pdf"], a:contains("Official Notification"), a:contains("Notification PDF"), a:contains("Download Notification")')
      .first()
      .attr('href') ?? undefined;

  return {
    title:            title.trim(),
    organization:     (org || title).trim(),
    notificationDate: startDate,
    lastDate,
    examDate,
    applyLink,
    notificationLink: notifLink,
    sourceUrl,
    vacancies,
    source: 'freejobalert',
  };
}

function extractVacancyFromTitle(title: string): number | undefined {
  const m = title.match(/(\d[\d,]+)\s*(?:posts?|vacancies|seats)/i);
  return m ? parseInt(m[1].replace(/,/g, ''), 10) : undefined;
}

// ──────────────────────────────────────────────
// Main export
// ──────────────────────────────────────────────

export async function scrapeFreeJobAlert(): Promise<ScraperResult> {
  console.log('[freejobalert] Fetching homepage…');

  let homeHtml: string;
  try {
    homeHtml = await fetchPage(HOME_URL);
  } catch (err) {
    console.error('[freejobalert] Could not fetch homepage:', err);
    return { jobs: [], exams: [] };
  }

  const articleLinks = extractArticleLinks(homeHtml);
  console.log(`[freejobalert] Found ${articleLinks.length} article links`);

  const linksToScrape = articleLinks.slice(0, MAX_DETAIL_PAGES);
  const jobs: RawJob[] = [];

  for (let i = 0; i < linksToScrape.length; i++) {
    const url = linksToScrape[i];
    try {
      const html = await fetchPage(url);
      const job  = parseArticlePage(html, url);
      if (job) {
        jobs.push(job);
        process.stdout.write(
          `\r[freejobalert] ${i + 1}/${linksToScrape.length}: ${job.title.slice(0, 55)}…`,
        );
      }
    } catch (err) {
      console.warn(`\n[freejobalert] Skipping ${url}: ${err}`);
    }

    if (i < linksToScrape.length - 1) await sleep(POLITE_DELAY);
  }

  console.log(`\n[freejobalert] Done. Scraped ${jobs.length} jobs`);
  return { jobs, exams: [] };
}