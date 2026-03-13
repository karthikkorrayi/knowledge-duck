import * as cheerio from 'cheerio';
import type { ScraperResult, RawJob } from '../types';

const BASE_URL   = 'https://www.freejobalert.com';
const HOME_URL   = BASE_URL + '/';
const MAX_PAGES  = 8;
const DELAY_MS   = 800;

const HEADERS = {
  'User-Agent':     'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Accept':         'text/html,application/xhtml+xml,*/*;q=0.8',
  'Accept-Language':'en-US,en;q=0.9',
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

function extractSections($: cheerio.CheerioAPI): Record<string, string> {
  const sections: Record<string, string> = {};
  const container = $('.entry-content, article, .post-content, main').first();

  container.find('h2, h3').each((_i, heading) => {
    const headingText = clean($(heading).text()).toLowerCase();

    const lines: string[] = [];
    let node = $(heading).next();
    while (node.length && !node.is('h2, h3')) {
      const text = clean(node.text());
      if (text.length > 2) lines.push(text);
      node = node.next();
    }

    if (lines.length > 0) {
      sections[headingText] = lines.join('\n');
    }
  });

  return sections;
}

function findSection(sections: Record<string, string>, ...keywords: string[]): string | undefined {
  for (const [heading, content] of Object.entries(sections)) {
    if (keywords.some((kw) => heading.includes(kw))) {
      return content;
    }
  }
  return undefined;
}

function buildTableMap($: cheerio.CheerioAPI): Record<string, string> {
  const map: Record<string, string> = {};
  $('table tr').each((_i, row) => {
    const cells = $(row).find('td, th');
    if (cells.length >= 2) {
      const k = clean($(cells[0]).text())
        .toLowerCase()
        .replace(/[*•:]/g, '')
        .trim();
      const v = clean($(cells[1]).text());
      if (k && v && v !== '-' && v !== 'N/A') map[k] = v;
    }
  });
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
  const AGGREGATORS = ['freejobalert', 'telugucareers', 'sarkarinaukri', 'rojgarresult', 'sarkariresult', 'govtnaukri'];

  const importantLinks: Array<{ text: string; href: string }> = [];
  $('a').each((_i, el) => {
    const href = $(el).attr('href') ?? '';
    const text = clean($(el).text()).toLowerCase();
    const isClean = href.startsWith('http') && !AGGREGATORS.some((a) => href.includes(a));
    if (isClean) importantLinks.push({ text, href });
  });

  const applyLink =
    importantLinks.find((l) =>
      (l.text.includes('apply online') || l.text.includes('apply now') || l.text.includes('apply here'))
      && !l.href.endsWith('.pdf')
    )?.href ??
    importantLinks.find((l) =>
      (l.href.includes('gov.in') || l.href.includes('nic.in') || l.href.includes('recruit'))
      && !l.href.endsWith('.pdf')
    )?.href;

  const pdfLink = importantLinks.find((l) =>
    l.href.endsWith('.pdf') || l.href.includes('.pdf?') ||
    l.text.includes('notification pdf') || l.text.includes('download notification') ||
    l.text.includes('official notification')
  )?.href;

  const officialSite = importantLinks.find((l) =>
    l.href.includes('gov.in') || l.href.includes('nic.in') || l.href.includes('.org.in')
  )?.href;

  return { applyLink, pdfLink, officialSite };
}

async function parseArticlePage(html: string, sourceUrl: string): Promise<RawJob | null> {
  const $ = cheerio.load(html);

  const title = clean($('h1').first().text());
  if (!title || title.length < 5) return null;

  const sections  = extractSections($);
  const tableMap  = buildTableMap($);
  const links     = extractLinks($);

  const org =
    pickTable(tableMap, 'organization name', 'organization', 'board name', 'department name', 'authority') ??
    (clean($('.org-name, .organization').first().text()) ||
    title.split(/\s+(?:recruitment|notification|jobs?)/i)[0].trim());

  const vacancyRaw =
    pickTable(tableMap, 'total vacancies', 'total posts', 'no. of posts', 'vacancies', 'number of posts') ??
    findSection(sections, 'vacancy')?.match(/(\d[\d,]+)\s*(?:post|vacanc)/i)?.[1];
  const vacancies = parseVacancies(vacancyRaw) ?? extractFromTitle(title);

  const lastDate =
    pickTable(tableMap, 'apply last date', 'last date to apply', 'last date', 'closing date', 'end date') ??
    extractDateFromSection(findSection(sections, 'important date', 'last date'), 'last');

  const examDate =
    pickTable(tableMap, 'exam date', 'written exam date', 'tentative exam date') ??
    extractDateFromSection(findSection(sections, 'important date', 'exam date'), 'exam');

  const notifDate =
    pickTable(tableMap, 'apply start date', 'start date', 'notification date', 'advt date') ??
    extractDateFromSection(findSection(sections, 'important date'), 'start');

  const salary =
    pickTable(tableMap, 'salary', 'pay scale', 'pay level', 'stipend', 'remuneration', 'ctc', 'pay band') ??
    extractFirstLine(findSection(sections, 'salary', 'pay'));

  const ageLimit =
    pickTable(tableMap, 'age limit', 'age', 'upper age') ??
    extractFirstLine(findSection(sections, 'age limit', 'age'));

  const qualification =
    pickTable(tableMap, 'qualification', 'educational qualification', 'eligibility', 'education') ??
    findSection(sections, 'eligibility criteria', 'eligibility', 'qualification');

  const selectionProcess =
    pickTable(tableMap, 'selection process', 'selection procedure', 'selection criteria') ??
    findSection(sections, 'selection process', 'selection procedure');

  const applicationFee =
    pickTable(tableMap, 'application fee', 'fee', 'registration fee', 'exam fee') ??
    extractFirstLine(findSection(sections, 'application fee', 'fee'));

  const jobLocation =
    pickTable(tableMap, 'job location', 'location', 'place of posting', 'work location');

  const howToApply = findSection(sections, 'how to apply', 'application process', 'how to');

  const officialWebsite =
    pickTable(tableMap, 'official website', 'website', 'official site') ??
    (links.officialSite ? extractDomain(links.officialSite) : undefined);

  const overviewText = findSection(sections, 'overview', 'about') ?? '';
  const description  = buildDescription({ org, title, vacancies, qualification, howToApply, overviewText });

  return {
    title:             title.slice(0, 200),
    organization:      (org || title).slice(0, 200),
    source:            'freejobalert',
    sourceUrl,
    notificationDate:  notifDate,
    lastDate,
    examDate,
    applyLink:         links.applyLink,
    notificationLink:  links.pdfLink ?? sourceUrl,
    notificationPdf:   links.pdfLink,
    officialWebsite,
    vacancies,
    jobLocation,
    ageLimit,
    qualification:     qualification?.slice(0, 500),
    salary,
    selectionProcess:  selectionProcess?.slice(0, 300),
    applicationFee,
    description:       description?.slice(0, 800),
  };
}


function extractFromTitle(title: string): number | undefined {
  const m = title.match(/(\d[\d,]+)\s*(?:posts?|vacancies|seats)/i);
  return m ? parseInt(m[1].replace(/,/g, ''), 10) : undefined;
}

function extractDateFromSection(text: string | undefined, type: string): string | undefined {
  if (!text) return undefined;
  const lines = text.split('\n');
  const line  = lines.find((l) => l.toLowerCase().includes(type));
  if (!line) return undefined;
  const m = line.match(/\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{1,2}\s+\w+\s+\d{4}/);
  return m ? m[0] : undefined;
}

function extractFirstLine(text: string | undefined): string | undefined {
  if (!text) return undefined;
  return text.split('\n')[0].trim().slice(0, 200) || undefined;
}

function extractDomain(url: string): string {
  try { return new URL(url).hostname.replace('www.', ''); }
  catch { return url; }
}

function buildDescription(params: {
  org: string; title: string; vacancies?: number;
  qualification?: string; howToApply?: string; overviewText: string;
}): string | undefined {
  const parts: string[] = [];
  if (params.overviewText) {
    parts.push(params.overviewText.slice(0, 300));
  } else {
    if (params.org)         parts.push(`${params.org} has released the ${params.title}.`);
    if (params.vacancies)   parts.push(`Total vacancies: ${params.vacancies}.`);
    if (params.qualification) parts.push(`Eligibility: ${params.qualification.slice(0, 150)}.`);
  }
  if (params.howToApply) {
    parts.push(`How to apply: ${params.howToApply.slice(0, 200)}`);
  }
  return parts.length ? parts.join(' ') : undefined;
}

function extractArticleLinks(html: string): string[] {
  const $ = cheerio.load(html);
  const links = new Set<string>();
  $('a[href]').each((_i, el) => {
    const href = $(el).attr('href') ?? '';
    if (href.startsWith(BASE_URL + '/') && href.split('/').length >= 5) {
      links.add(href.split('?')[0]);
    }
  });
  return Array.from(links).filter((u) => !u.endsWith(BASE_URL + '/'));
}

export async function scrapeFreeJobAlert(): Promise<ScraperResult> {
  console.log('[freejobalert] Fetching homepage…');
  let homeHtml: string;
  try   { homeHtml = await fetchPage(HOME_URL); }
  catch (err) { console.error('[freejobalert] Homepage failed:', err); return { jobs: [], exams: [] }; }

  const links = extractArticleLinks(homeHtml);
  console.log(`[freejobalert] Found ${links.length} article links`);

  const toScrape = links.slice(0, MAX_PAGES);
  const jobs: RawJob[] = [];

  for (let i = 0; i < toScrape.length; i++) {
    try {
      const html = await fetchPage(toScrape[i]);
      const job  = await parseArticlePage(html, toScrape[i]);
      if (job) {
        jobs.push(job);
        const info = [
          job.vacancies    ? `${job.vacancies} posts`         : '',
          job.salary       ? job.salary.slice(0, 20)          : '',
          job.lastDate     ? `last: ${job.lastDate}`          : '',
          job.qualification? '✓ eligibility'                  : '',
        ].filter(Boolean).join(' | ');
        console.log(`[freejobalert] ${i+1}/${toScrape.length}: ${job.title.slice(0,50)}… ${info}`);
      }
    } catch (err) {
      console.warn(`[freejobalert] Skip ${toScrape[i]}: ${err}`);
    }
    if (i < toScrape.length - 1) await sleep(DELAY_MS);
  }

  console.log(`[freejobalert] Done. Scraped ${jobs.length} jobs`);
  return { jobs, exams: [] };
}