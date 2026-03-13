import * as cheerio from 'cheerio';
import { quickTranslate, translateToEnglish } from '../translator';
import type { ScraperResult, RawJob, JobState } from '../types';

const BASE_URL = 'https://www.telugucareers.com';

const STATE_PAGES: { state: JobState; url: string }[] = [
  { state: 'AP',      url: `${BASE_URL}/category/state-govt-jobs/andhrapradesh/` },
  { state: 'TS',      url: `${BASE_URL}/category/state-govt-jobs/telangana/` },
  { state: 'CENTRAL', url: `${BASE_URL}/category/central-govt-jobs/` },
];

const MAX_ARTICLES = 15;
const DELAY_MS     = 800;

const HEADERS = {
  'User-Agent':     'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Accept':         'text/html,application/xhtml+xml,*/*;q=0.8',
  'Accept-Language':'en-US,en;q=0.9,te;q=0.8',
  'Referer':        BASE_URL,
};

function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

async function fetchPage(url: string, retries = 3): Promise<string> {
  for (let i = 1; i <= retries; i++) {
    try {
      const res = await fetch(url, { headers: HEADERS });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    } catch (err) {
      if (i === retries) throw err;
      await sleep(2000 * i);
    }
  }
  throw new Error(`Failed: ${url}`);
}

function clean(s: string): string {
  return s.replace(/\s+/g, ' ').trim();
}

function parseVacancies(raw?: string): number | undefined {
  if (!raw) return undefined;
  const m = raw.replace(/,/g, '').match(/\d+/);
  if (!m) return undefined;
  const n = parseInt(m[0], 10);
  return isNaN(n) || n > 500000 ? undefined : n;
}

function extractDomain(url: string): string {
  try { return new URL(url).hostname.replace('www.', ''); }
  catch { return url; }
}

async function extractSections($: cheerio.CheerioAPI): Promise<Record<string, string>> {
  const sections: Record<string, string> = {};

  const headings = $('.entry-content h2, .entry-content h3, article h2, article h3').toArray();

  for (const heading of headings) {
    const rawHeading = clean($(heading).text());
    if (!rawHeading || rawHeading.length > 100) continue;

    let engHeading = quickTranslate(rawHeading).toLowerCase();
    if (engHeading === rawHeading.toLowerCase()) {
      engHeading = (await translateToEnglish(rawHeading)).toLowerCase();
    }

    const lines: string[] = [];
    let node = $(heading).next();
    while (node.length && !node.is('h2, h3')) {
      const text = clean(node.text());
      if (text.length > 2) lines.push(text);
      node = node.next();
    }

    sections[engHeading] = lines.join('\n');
  }

  return sections;
}

function findSection(sections: Record<string, string>, ...keywords: string[]): string | undefined {
  for (const [heading, content] of Object.entries(sections)) {
    if (keywords.some((kw) => heading.includes(kw))) return content;
  }
  return undefined;
}

async function buildTableMap($: cheerio.CheerioAPI): Promise<Record<string, string>> {
  const map: Record<string, string> = {};

  const rows = $('table tr').toArray();
  for (const row of rows) {
    const cells = $(row).find('td, th');
    if (cells.length < 2) continue;

    const rawKey = clean($(cells[0]).text()).replace(/[*•:]/g, '').trim();
    const val    = clean($(cells[1]).text());
    if (!rawKey || !val || val === '-' || val === 'N/A') continue;

    let engKey = quickTranslate(rawKey).toLowerCase();
    if (engKey === rawKey.toLowerCase()) {
      engKey = (await translateToEnglish(rawKey)).toLowerCase();
    }

    map[engKey] = val;
    map[rawKey.toLowerCase()] = val; // keep original too for fallback
  }

  return map;
}

function pickTable(map: Record<string, string>, ...keys: string[]): string | undefined {
  for (const k of keys) {
    if (map[k]) return map[k];
    const found = Object.entries(map).find(([mk]) => mk.includes(k));
    if (found) return found[1];
  }
  return undefined;
}

function extractLinks($: cheerio.CheerioAPI) {
  const allLinks = $('a[href]').toArray().map((el) => ({
    text: clean($(el).text()).toLowerCase(),
    href: $(el).attr('href') ?? '',
  })).filter((l) => l.href.startsWith('http') && !l.href.includes('telugucareers'));

  const pdfLink = allLinks.find((l) =>
    l.href.endsWith('.pdf') || l.href.includes('.pdf?') ||
    l.text.includes('notification pdf') || l.text.includes('pdf')
  )?.href;

  const applyLink = allLinks.find((l) =>
    l.text.includes('apply online') || l.text.includes('apply now') ||
    l.text.includes('apply here') || l.text.includes('దరఖాస్తు')
  )?.href;

  const officialSite = allLinks.find((l) =>
    l.href.includes('gov.in') || l.href.includes('nic.in') ||
    l.href.includes('.org') || l.href.includes('.in/')
  )?.href;

  return { pdfLink, applyLink, officialSite };
}

// ── Date extraction from Important Dates section ──────────────────
function extractDate(text: string | undefined, ...keywords: string[]): string | undefined {
  if (!text) return undefined;
  const lines = text.split('\n');
  for (const kw of keywords) {
    const line = lines.find((l) => l.toLowerCase().includes(kw));
    if (line) {
      const m = line.match(/\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{1,2}\s+\w+\s+\d{4}/);
      if (m) return m[0];
    }
  }
  return undefined;
}

function buildDescription(params: {
  org: string; title: string; vacancies?: number;
  qualification?: string; salary?: string; howToApply?: string;
}): string {
  const parts: string[] = [];
  if (params.org)           parts.push(`${params.org} has released recruitment notification for ${params.title}.`);
  if (params.vacancies)     parts.push(`Total Vacancies: ${params.vacancies}.`);
  if (params.qualification) parts.push(`Eligibility: ${params.qualification.slice(0, 150)}.`);
  if (params.salary)        parts.push(`Salary: ${params.salary}.`);
  if (params.howToApply)    parts.push(`Apply: ${params.howToApply.slice(0, 150)}.`);
  return parts.join(' ');
}

async function parseArticle(html: string, sourceUrl: string, forcedState: JobState): Promise<RawJob | null> {
  const $ = cheerio.load(html);

  const rawTitle = clean($('h1').first().text());
  if (!rawTitle || rawTitle.length < 5) return null;

  const title = await translateToEnglish(rawTitle);

  const sections = await extractSections($);
  const tableMap = await buildTableMap($);
  const links    = extractLinks($);

  const datesSection = findSection(sections,
    'important date', 'important dates', 'key dates', 'dates', 'schedule'
  );

  const orgRaw =
    pickTable(tableMap, 'organization name', 'organization', 'board name', 'department', 'authority', 'recruiter') ??
    clean($('strong, b').first().text()).slice(0, 150);
  const org = orgRaw ? await translateToEnglish(orgRaw) : title.split(/\d/)[0].trim();

  const postRaw = pickTable(tableMap, 'post name', 'post', 'designation', 'role', 'name of post');
  const postName = postRaw ? await translateToEnglish(postRaw) : undefined;

  const vacancyRaw = pickTable(tableMap, 'total vacancies', 'total posts', 'no of posts', 'vacancies', 'posts');
  const vacancies  = parseVacancies(vacancyRaw);

  const salaryRaw = pickTable(tableMap, 'salary', 'pay scale', 'pay level', 'stipend', 'remuneration', 'pay band') ??
    findSection(sections, 'salary', 'pay scale', 'stipend', 'remuneration');
  const salary = salaryRaw
    ? (await translateToEnglish(salaryRaw.split('\n')[0])).slice(0, 200)
    : undefined;

  const ageRaw = pickTable(tableMap, 'age limit', 'age', 'upper age') ??
    findSection(sections, 'age limit', 'age');
  const ageLimit = ageRaw
    ? (await translateToEnglish(ageRaw.split('\n')[0])).slice(0, 100)
    : undefined;

  const qualRaw = pickTable(tableMap, 'qualification', 'educational qualification', 'eligibility', 'education') ??
    findSection(sections, 'eligibility', 'qualification', 'who can apply', 'educational');
  const qualification = qualRaw
    ? (await translateToEnglish(qualRaw.slice(0, 400))).slice(0, 500)
    : undefined;

  const selRaw = pickTable(tableMap, 'selection process', 'selection procedure', 'selection') ??
    findSection(sections, 'selection process', 'selection procedure');
  const selectionProcess = selRaw
    ? (await translateToEnglish(selRaw.slice(0, 300))).slice(0, 300)
    : undefined;

  const feeRaw = pickTable(tableMap, 'application fee', 'fee', 'registration fee', 'exam fee') ??
    findSection(sections, 'application fee', 'fee');
  const applicationFee = feeRaw
    ? (await translateToEnglish(feeRaw.split('\n')[0])).slice(0, 200)
    : undefined;

  const howRaw = findSection(sections, 'how to apply', 'application process', 'apply online', 'apply');
  const howToApply = howRaw ? (await translateToEnglish(howRaw.slice(0, 400))).slice(0, 400) : undefined;

  const lastDate =
    pickTable(tableMap, 'last date', 'apply last date', 'last date to apply', 'closing date') ??
    extractDate(datesSection, 'last date', 'closing date', 'final date') ??
    extractDate(datesSection, 'last', 'end');

  const examDate =
    pickTable(tableMap, 'exam date', 'written exam date', 'test date') ??
    extractDate(datesSection, 'exam date', 'exam');

  const notifDate =
    pickTable(tableMap, 'notification date', 'advt date', 'start date', 'apply start date') ??
    extractDate(datesSection, 'notification date', 'start date', 'start') ??
    (() => {
      const m = sourceUrl.match(/\/(\d{4})\/(\d{2})\/(\d{2})\//);
      return m ? `${m[3]}/${m[2]}/${m[1]}` : undefined;
    })();

  const locRaw = pickTable(tableMap, 'job location', 'location', 'place of posting', 'work location', 'posting');
  const jobLocation = locRaw ? await translateToEnglish(locRaw) : undefined;

  const siteRaw = pickTable(tableMap, 'official website', 'website', 'official site');
  const officialWebsite = siteRaw ?? (links.officialSite ? extractDomain(links.officialSite) : undefined);

  const description = buildDescription({ org, title, vacancies, qualification, salary, howToApply });

  return {
    title:             title.slice(0, 200),
    organization:      (org || title).slice(0, 200),
    source:            'telugucareers',
    sourceUrl,
    forcedState,
    notificationDate:  notifDate,
    lastDate,
    examDate,
    vacancies,
    jobLocation,
    ageLimit,
    qualification:     qualification?.slice(0, 500),
    salary,
    selectionProcess:  selectionProcess?.slice(0, 300),
    applicationFee,
    officialWebsite,
    notificationPdf:   links.pdfLink,
    applyLink:         links.applyLink,
    notificationLink:  sourceUrl,
    description:       description.slice(0, 800) || undefined,
  };
}

function extractArticleLinks(html: string): string[] {
  const $ = cheerio.load(html);
  const links = new Set<string>();
  $('h2 a, h3 a, .entry-title a, article a[href]').each((_i, el) => {
    const href = $(el).attr('href') ?? '';
    if (href.startsWith(BASE_URL) && /\/\d{4}\/\d{2}\/\d{2}\//.test(href)) {
      links.add(href);
    }
  });
  return Array.from(links);
}

async function scrapeState(state: JobState, categoryUrl: string): Promise<RawJob[]> {
  console.log(`\n[telugucareers] Scraping ${state}`);
  let html: string;
  try   { html = await fetchPage(categoryUrl); }
  catch (err) { console.error(`[telugucareers] Failed ${state}:`, err); return []; }

  const links = extractArticleLinks(html).slice(0, MAX_ARTICLES);
  console.log(`[telugucareers] ${state}: ${links.length} articles`);

  const jobs: RawJob[] = [];
  for (let i = 0; i < links.length; i++) {
    try {
      const pageHtml = await fetchPage(links[i]);
      const job      = await parseArticle(pageHtml, links[i], state);
      if (job) {
        jobs.push(job);
        const info = [
          job.vacancies      ? `${job.vacancies} posts`       : '',
          job.salary         ? job.salary.slice(0, 20)        : '',
          job.lastDate       ? `last: ${job.lastDate}`        : '',
          job.qualification  ? '✓ eligibility'               : '',
          job.selectionProcess ? '✓ selection'              : '',
        ].filter(Boolean).join(' | ');
        console.log(`[telugucareers] ${state} ${i+1}/${links.length}: ${job.title.slice(0, 45)}… ${info}`);
      }
    } catch (err) {
      console.warn(`[telugucareers] Skip ${links[i]}: ${err}`);
    }
    if (i < links.length - 1) await sleep(DELAY_MS);
  }

  console.log(`[telugucareers] ${state}: ${jobs.length} jobs done`);
  return jobs;
}

export async function scrapeTeluguCareers(): Promise<ScraperResult> {
  const all: RawJob[] = [];
  for (const { state, url } of STATE_PAGES) {
    all.push(...await scrapeState(state, url));
    await sleep(1500);
  }
  console.log(`\n[telugucareers] Total: ${all.length} jobs`);
  return { jobs: all, exams: [] };
}

export async function scrapeTeluguCareersState(state: JobState): Promise<RawJob[]> {
  const page = STATE_PAGES.find((p) => p.state === state);
  if (!page) return [];
  return scrapeState(state, page.url);
}