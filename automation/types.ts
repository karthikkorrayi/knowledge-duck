export type JobState = 'AP' | 'TS' | 'CENTRAL' | 'OTHER';

export interface RawJob {
  title:             string;
  organization:      string;
  notificationDate?: string;
  lastDate?:         string;
  examDate?:         string;
  applyLink?:        string;
  notificationLink?: string;
  sourceUrl:         string;
  vacancies?:        number;
  category?:         string;
  department?:       string;
  source:            string;

  // ── NEW ──────────────────────────────────────────────────────────
  // When a scraper already knows the state (e.g. telugucareers scrapes
  // the AP category page directly), set this to skip keyword guessing.
  // normalizeJobs() will use this directly instead of classifyState().
  forcedState?: JobState;
}

export interface NormalizedJob {
  title:             string;
  organization:      string;
  state:             JobState;
  category?:         string;
  department?:       string;
  notification_date?: string;
  last_date?:        string;
  exam_date?:        string;
  apply_link?:       string;
  notification_link?: string;
  source_url?:       string;
  vacancies?:        number;
  is_active:         boolean;
  is_featured:       boolean;
  source:            string;
  source_id:         string;
  raw_data?:         Record<string, unknown>;
}

export interface RawExam {
  title:             string;
  organization:      string;
  examDate?:         string;
  admitCardDate?:    string;
  resultDate?:       string;
  applyLink?:        string;
  notificationLink?: string;
  sourceUrl:         string;
  source:            string;
  forcedState?:      JobState;
}

export interface NormalizedExam {
  title:              string;
  organization:       string;
  state:              JobState;
  exam_date?:         string;
  admit_card_date?:   string;
  result_date?:       string;
  apply_link?:        string;
  notification_link?: string;
  source_url?:        string;
  is_active:          boolean;
  source:             string;
  source_id:          string;
  raw_data?:          Record<string, unknown>;
}

export interface ScraperResult {
  jobs:  RawJob[];
  exams: RawExam[];
}

export interface RunReport {
  scraperName: string;
  jobsScraped: number;
  jobsSaved:   number;
  examsSaved:  number;
  errors:      string[];
  durationMs:  number;
}