export interface AIExtractedJob {
  organization:       string | null;
  post_name:          string | null;
  vacancies:          number | null;
  job_location:       string | null;
  salary:             string | null;
  age_limit:          string | null;
  qualification:      string | null;
  selection_process:  string | null;
  application_fee:    string | null;
  last_date:          string | null;
  exam_date:          string | null;
  notification_date:  string | null;
  apply_link:         string | null;
  notification_pdf:   string | null;
  official_website:   string | null;
  description:        string | null;
}

export async function extractJobWithAI(
  _text: string,
  _url:  string,
): Promise<AIExtractedJob | null> {
  return null;
}

export function htmlToPlainText(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}