// Classifies a job/exam as AP, TS, CENTRAL, or OTHER
// based on keywords in title, organization, and department.
//
// Central jobs: SSC, UPSC, Railways, Banks, Defence, etc.
// AP jobs: APPSC, APSSB, AP Police, etc.
// TS jobs: TSPSC, Telangana Police, TSGENCO, etc.

import type { JobState, RawJob, RawExam } from './types';

// ──────────────────────────────────────────────
// Keyword lists
// ──────────────────────────────────────────────

const AP_KEYWORDS = [
  'andhra pradesh', 'ap ', ' ap ', 'appsc', 'apssb', 'ap police',
  'ap state', 'apgenco', 'apnpdcl', 'apspdcl', 'aptransco',
  'ap tet', 'aptet', 'apicet', 'ap icet', 'rgukt',
  'ap dsc', 'apdsc', 'aphmhiw', 'ap high court',
  'visakhapatnam', 'vijayawada', 'tirupati', 'guntur',
  'krishna district', 'anantapur', 'kurnool',
];

const TS_KEYWORDS = [
  'telangana', 'tspsc', 'ts police', 'ts state', 'tsgenco',
  'tsnpdcl', 'tsspdcl', 'ts tet', 'tstet', 'tsicet',
  'ts dsc', 'tsdsc', 'ts high court', 'tsrtc', 'hmwssb',
  'ghmc', 'hyderabad', 'secunderabad', 'warangal', 'nizamabad',
  'karimnagar', 'khammam', 'mahbubnagar', 'nalgonda',
  'ts eamcet', 'tseamcet',
];

const CENTRAL_KEYWORDS = [
  'ssc', 'upsc', 'ias', 'ips', 'ifs',
  'railway', 'rrb', 'rlwl', 'rrc',
  'bank', 'ibps', 'sbi ', 'rbi ', 'nabard', 'exim bank',
  'defence', 'army', 'navy', 'air force', 'indian air',
  'coast guard', 'crpf', 'bsf', 'cisf', 'itbp', 'ssb ',
  'esic', 'epfo', 'nps ',
  'isro', 'drdo', 'barc', 'ntpc ', 'bhel', 'ongc',
  'sail ', 'hpcl', 'bpcl', 'iocl', 'gail',
  'nit ', 'iit ', 'iiit ', 'iim ', 'aiims',
  'high court', 'supreme court', 'district court',
  'income tax', 'customs', 'excise', 'cbi ',
  'nsc ', 'fci ', 'bsnl', 'india post', 'postal',
  'national health', 'nhm ', 'pgi ', 'cghs',
  'kendriya vidyalaya', 'kvs ', 'nvs ', 'navodaya',
  'union public service', 'staff selection',
  'central government', 'ministry', 'department of',
];

// ──────────────────────────────────────────────
// Helper
// ──────────────────────────────────────────────

function normalize(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
}

function containsAny(text: string, keywords: string[]): boolean {
  const n = normalize(text);
  return keywords.some((kw) => n.includes(kw.toLowerCase()));
}

// ──────────────────────────────────────────────
// Main classifier
// ──────────────────────────────────────────────

export function classifyState(
  title: string,
  organization: string,
  department?: string,
): JobState {
  const combined = `${title} ${organization} ${department ?? ''}`;

  // AP check first (more specific)
  if (containsAny(combined, AP_KEYWORDS)) return 'AP';

  // TS check
  if (containsAny(combined, TS_KEYWORDS)) return 'TS';

  // Central check
  if (containsAny(combined, CENTRAL_KEYWORDS)) return 'CENTRAL';

  return 'OTHER';
}

// ──────────────────────────────────────────────
// Filter functions — drop OTHER state
// ──────────────────────────────────────────────

export function shouldIncludeJob(job: RawJob): boolean {
  const state = classifyState(job.title, job.organization, job.department);
  return state !== 'OTHER';
}

export function shouldIncludeExam(exam: RawExam): boolean {
  const state = classifyState(exam.title, exam.organization);
  return state !== 'OTHER';
}

// ──────────────────────────────────────────────
// Category detector (for nice display grouping)
// ──────────────────────────────────────────────

const CATEGORY_MAP: Record<string, string[]> = {
  'Teaching':  ['teacher', 'lecturer', 'professor', 'tet', 'dsc', 'principal', 'vidyalaya'],
  'Banking':   ['bank', 'ibps', 'sbi', 'rbi', 'nabard', 'exim', 'rrb bank'],
  'Railway':   ['railway', 'rrb', 'rrc', 'rail'],
  'Police':    ['police', 'constable', 'si ', 'sub inspector', 'crpf', 'bsf', 'cisf'],
  'Defence':   ['army', 'navy', 'air force', 'defence', 'coast guard', 'nda ', 'cds '],
  'Engineering': ['engineer', 'junior engineer', 'je ', 'ae ', 'technical', 'drdo', 'isro', 'barc'],
  'Medical':   ['doctor', 'nurse', 'pharmacist', 'lab technician', 'aiims', 'health', 'medical'],
  'Clerk':     ['clerk', 'typist', 'steno', 'stenographer', 'data entry'],
  'PSU':       ['ntpc', 'bhel', 'ongc', 'sail', 'hpcl', 'bpcl', 'iocl', 'gail', 'nhpc'],
  'Civil Services': ['upsc', 'ias', 'ips', 'ifs', 'appsc', 'tspsc', 'group 1', 'group 2', 'group 4'],
};

export function detectCategory(title: string, organization: string): string | undefined {
  const combined = normalize(`${title} ${organization}`);
  for (const [category, keywords] of Object.entries(CATEGORY_MAP)) {
    if (keywords.some((kw) => combined.includes(kw.toLowerCase()))) {
      return category;
    }
  }
  return undefined;
}

// ──────────────────────────────────────────────
// Department extractor
// ──────────────────────────────────────────────

const DEPT_PATTERNS: [RegExp, string][] = [
  [/\bappsc\b/i,  'APPSC'],
  [/\btspsc\b/i,  'TSPSC'],
  [/\bapssb\b/i,  'APSSB'],
  [/\bupsc\b/i,   'UPSC'],
  [/\bssc\b/i,    'SSC'],
  [/\brrb\b/i,    'RRB'],
  [/\brrc\b/i,    'RRC'],
  [/\bibps\b/i,   'IBPS'],
  [/\bsbi\b/i,    'SBI'],
  [/\brbi\b/i,    'RBI'],
  [/\besic\b/i,   'ESIC'],
  [/\bepfo\b/i,   'EPFO'],
  [/\bisro\b/i,   'ISRO'],
  [/\bdrdo\b/i,   'DRDO'],
  [/\bbarc\b/i,   'BARC'],
];

export function extractDepartment(title: string, organization: string): string | undefined {
  const combined = `${title} ${organization}`;
  for (const [pattern, dept] of DEPT_PATTERNS) {
    if (pattern.test(combined)) return dept;
  }
  return undefined;
}