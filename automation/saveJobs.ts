import crypto from 'crypto';
import { classifyState, detectCategory, extractDepartment } from './filters';
import type { RawJob, RawExam, NormalizedJob, NormalizedExam, JobState } from './types';

function parseDate(raw?: string): string | undefined {
  if (!raw) return undefined;
  const s = raw.trim().replace(/\s+/g, ' ');

  const dmy = s.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})$/);
  if (dmy) {
    const year = dmy[3].length === 2 ? `20${dmy[3]}` : dmy[3];
    return `${year}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`;
  }

  const MONTHS: Record<string, string> = {
    january:'01', february:'02', march:'03', april:'04', may:'05', june:'06',
    july:'07', august:'08', september:'09', october:'10', november:'11', december:'12',
    jan:'01', feb:'02', mar:'03', apr:'04', jun:'06', jul:'07', aug:'08',
    sep:'09', oct:'10', nov:'11', dec:'12',
  };
  const m1 = s.match(/(\d{1,2})\s+([a-z]+)\s+(\d{4})/i);
  if (m1) { const mon = MONTHS[m1[2].toLowerCase()]; if (mon) return `${m1[3]}-${mon}-${m1[1].padStart(2, '0')}`; }
  const m2 = s.match(/([a-z]+)\s+(\d{1,2})[,\s]+(\d{4})/i);
  if (m2) { const mon = MONTHS[m2[1].toLowerCase()]; if (mon) return `${m2[3]}-${mon}-${m2[2].padStart(2, '0')}`; }

  return undefined;
}

function makeSourceId(title: string, org: string, source: string): string {
  const key = `${source}::${org.toLowerCase().trim()}::${title.toLowerCase().trim()}`;
  return crypto.createHash('sha256').update(key).digest('hex').slice(0, 32);
}

function resolveState(job: RawJob): JobState {
  if (job.forcedState && job.forcedState !== 'OTHER') return job.forcedState;
  const dept = job.department ?? extractDepartment(job.title, job.organization);
  return classifyState(job.title, job.organization, dept);
}

function sanitizeVacancies(raw: number | undefined): number | undefined {
  if (raw === undefined || raw === null) return undefined;
  if (typeof raw === 'number' && !isNaN(raw) && raw > 0 && raw <= 500000) return raw;
  return undefined;
}

export function normalizeJobs(rawJobs: RawJob[]): NormalizedJob[] {
  const seen = new Set<string>();
  const result: NormalizedJob[] = [];

  for (const raw of rawJobs) {
    const state = resolveState(raw);
    if (!raw.forcedState && state === 'OTHER') continue;

    const dept = raw.department ?? extractDepartment(raw.title, raw.organization);
    const cat  = raw.category   ?? detectCategory(raw.title, raw.organization);
    const sid  = makeSourceId(raw.title, raw.organization, raw.source);

    if (seen.has(sid)) continue;
    seen.add(sid);

    result.push({
      // Core
      title:              raw.title.trim(),
      organization:       raw.organization.trim(),
      state,
      category:           cat,
      department:         dept,

      // Dates
      notification_date:  parseDate(raw.notificationDate),
      last_date:          parseDate(raw.lastDate),
      exam_date:          parseDate(raw.examDate),

      // Links
      apply_link:         raw.applyLink,
      notification_link:  raw.notificationLink,
      notification_pdf:   raw.notificationPdf,
      source_url:         raw.sourceUrl,
      official_website:   raw.officialWebsite,

      // Numbers
      vacancies:          sanitizeVacancies(raw.vacancies),

      // Rich detail fields
      job_location:       raw.jobLocation,
      age_limit:          raw.ageLimit,
      qualification:      raw.qualification,
      salary:             raw.salary,
      selection_process:  raw.selectionProcess,
      application_fee:    raw.applicationFee,
      description:        raw.description?.slice(0, 5000), // cap at 5KB

      // Metadata
      is_active:          true,
      is_featured:        false,
      source:             raw.source,
      source_id:          sid,
      raw_data:           raw as unknown as Record<string, unknown>,
    });
  }

  return result;
}

export function normalizeExams(rawExams: RawExam[]): NormalizedExam[] {
  const seen = new Set<string>();
  const result: NormalizedExam[] = [];

  for (const raw of rawExams) {
    const state = raw.forcedState && raw.forcedState !== 'OTHER'
      ? raw.forcedState
      : classifyState(raw.title, raw.organization);
    if (!raw.forcedState && state === 'OTHER') continue;

    const sid = makeSourceId(raw.title, raw.organization, raw.source);
    if (seen.has(sid)) continue;
    seen.add(sid);

    result.push({
      title:             raw.title.trim(),
      organization:      raw.organization.trim(),
      state,
      exam_date:         parseDate(raw.examDate),
      admit_card_date:   parseDate(raw.admitCardDate),
      result_date:       parseDate(raw.resultDate),
      apply_link:        raw.applyLink,
      notification_link: raw.notificationLink,
      source_url:        raw.sourceUrl,
      is_active:         true,
      source:            raw.source,
      source_id:         sid,
      raw_data:          raw as unknown as Record<string, unknown>,
    });
  }

  return result;
}