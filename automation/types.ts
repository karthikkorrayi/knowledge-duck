export type JobState = 'AP' | 'TS' | 'CENTRAL' | 'OTHER';

export interface RawJob {
  title:              string;
  organization:       string;
  source:             string;       // 'freejobalert' | 'telugucareers'
  sourceUrl:          string;

  forcedState?:       JobState;

  notificationDate?:  string;       // start date / release date
  lastDate?:          string;       // application deadline
  examDate?:          string;

  vacancies?:         number;

  category?:          string;       // 'SSC Jobs' | 'Bank Jobs' | …
  department?:        string;

  jobLocation?:       string;       // "Mumbai, Bhusawal, Pune"
  ageLimit?:          string;       // "18-33 years"
  qualification?:     string;       // "10th Pass / ITI"
  salary?:            string;       // "₹9,600/month" or "Pay Level 4"
  selectionProcess?:  string;       // "Merit Based | Document Verification"
  applicationFee?:    string;       // "General: ₹100 | SC/ST: Free"
  description?:       string;       // 2-3 sentence English summary
  officialWebsite?:   string;       // "rrccr.com"

  applyLink?:         string;       // direct online application URL
  notificationLink?:  string;       // article / info page URL
  notificationPdf?:   string;       // direct .pdf download link
}

export interface NormalizedJob {
  // Core
  title:              string;
  organization:       string;
  state:              JobState;
  category?:          string;
  department?:        string;

  // Dates (ISO YYYY-MM-DD)
  notification_date?: string;
  last_date?:         string;
  exam_date?:         string;

  // Links
  apply_link?:        string;
  notification_link?: string;
  notification_pdf?:  string;
  source_url?:        string;
  official_website?:  string;

  // Numbers
  vacancies?:         number;

  job_location?:      string;
  age_limit?:         string;
  qualification?:     string;
  salary?:            string;
  selection_process?: string;
  application_fee?:   string;
  description?:       string;

  // Metadata
  is_active:          boolean;
  is_featured:        boolean;
  source:             string;
  source_id:          string;
  raw_data?:          Record<string, unknown>;
}

export interface RawExam {
  title:              string;
  organization:       string;
  examDate?:          string;
  admitCardDate?:     string;
  resultDate?:        string;
  applyLink?:         string;
  notificationLink?:  string;
  sourceUrl:          string;
  source:             string;
  forcedState?:       JobState;
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