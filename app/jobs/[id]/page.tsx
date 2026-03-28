import Link from 'next/link';
import { notFound } from 'next/navigation';
import DashboardHeader from '@/components/DashboardHeader';
import JobDetailTabs, { type TabItem } from '@/components/JobDetailTabs';

interface Job {
  id:                 string;
  title:              string;
  organization:       string;
  state:              string;
  category?:          string;
  department?:        string;
  notification_date?: string;
  last_date?:         string;
  exam_date?:         string;
  apply_link?:        string;
  notification_link?: string;
  notification_pdf?:  string;
  source_url?:        string;
  official_website?:  string;
  vacancies?:         number;
  job_location?:      string;
  age_limit?:         string;
  qualification?:     string;
  salary?:            string;
  selection_process?: string;
  application_fee?:   string;
  description?:       string;
  is_featured:        boolean;
  source:             string;
  created_at:         string;
}

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

async function fetchJob(id: string): Promise<Job | null> {
  try {
    const res = await fetch(`${BASE}/api/jobs/${id}`, { next: { revalidate: 300 } });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`${res.status}`);
    return res.json();
  } catch { return null; }
}

// Parse any date string safely into a Date object (avoiding UTC midnight timezone shift)
function parseAnyDate(iso?: string): Date | null {
  if (!iso) return null;
  const s = iso.trim();
  // DD/MM/YYYY or DD-MM-YYYY
  const dmy = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (dmy) {
    const y = dmy[3].length === 2 ? `20${dmy[3]}` : dmy[3];
    // Use T12:00:00 so timezone offset never flips the date
    return new Date(`${y}-${dmy[2].padStart(2,'0')}-${dmy[1].padStart(2,'0')}T12:00:00`);
  }
  // YYYY-MM-DD (ISO from DB)
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    return new Date(`${s}T12:00:00`);
  }
  // Full ISO with time
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

function fmt(iso?: string): string {
  const d = parseAnyDate(iso);
  if (!d) return '';
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
}

function isExpired(iso?: string): boolean {
  const d = parseAnyDate(iso);
  if (!d) return false;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return d < today;
}

const STATE_LABEL: Record<string, string> = {
  AP: 'Andhra Pradesh', TS: 'Telangana', CENTRAL: 'All India',
};

// Strip emojis from scraped data values
function stripEmoji(text?: string): string {
  return (text ?? '').replace(/[\u{1F300}-\u{1FFFF}]/gu, '').replace(/[\u2600-\u27BF]/g, '').trim();
}

// Parse selection process into steps array
function parseSteps(raw?: string): string[] {
  if (!raw) return [];
  return raw
    .split(/[|\n,\/]/)
    .map((s) => stripEmoji(s).trim())
    .filter((s) => s.length > 1);
}

// Parse application fee into category rows
function parseFee(raw?: string): { category: string; amount: string }[] {
  if (!raw) return [];
  return raw
    .split(/[|\n]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => {
      const parts = s.split(/[:–-]/).map((p) => p.trim());
      return parts.length >= 2
        ? { category: parts[0], amount: parts.slice(1).join(' ') }
        : { category: s, amount: '' };
    });
}

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const job = await fetchJob(id);
  if (!job) notFound();

  const expired  = isExpired(job.last_date);

  // Official apply link — never a 3rd party aggregator
  const AGGREGATORS = ['telugucareers', 'freejobalert', 'sarkarinaukri',
                       'rojgarresult', 'sarkariresult', 'govtnaukri', 'naukri.com'];
  const rawApply = job.apply_link ?? '';
  // Never use source_url as apply link — it's always the aggregator article URL
  const isAggregator = !rawApply || AGGREGATORS.some((a) => rawApply.includes(a));
  const applyUrl = isAggregator ? null : rawApply;

  const pdfUrl   = job.notification_pdf ?? job.notification_link ?? null;
  const siteUrl  = job.official_website
    ? (job.official_website.startsWith('http') ? job.official_website : `https://${job.official_website}`)
    : null;

  const selSteps  = parseSteps(job.selection_process);
  const feeRows   = parseFee(job.application_fee);
  const hasDetails = !!(job.description || job.vacancies || job.salary);
  const hasEligibility = !!(job.qualification || job.age_limit);
  const hasApplication = !!(selSteps.length || feeRows.length || applyUrl);
  const hasDates = !!(job.last_date || job.exam_date || job.notification_date);

  const detailsContent = (

    <div className="space-y-6">
      {job.description && (
        <div>
          <h3 className="text-base font-bold text-gray-800 mb-2">Job Overview</h3>
          <div className="text-sm text-gray-600 leading-relaxed space-y-2">
            {stripEmoji(job.description).split(/\n\n+/).filter(Boolean).map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Vacancy table */}
        {job.vacancies && (
          <div>
            <h3 className="text-base font-bold text-gray-800 mb-3">Vacancy Details</h3>
            <div className="rounded-xl overflow-hidden border border-gray-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#1d4ed8] text-white">
                    <th className="text-left px-4 py-2.5 font-semibold">Post</th>
                    <th className="text-right px-4 py-2.5 font-semibold">Vacancies</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-2.5 text-gray-800">{job.department ?? job.category ?? 'Various Posts'}</td>
                    <td className="px-4 py-2.5 text-right font-bold text-gray-800">{job.vacancies.toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Salary */}
        {job.salary && (
          <div>
            <h3 className="text-base font-bold text-gray-800 mb-3">Salary</h3>
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
              <p className="text-lg font-bold text-blue-700 mb-1">{stripEmoji(job.salary)}</p>
            </div>
          </div>
        )}
      </div>

      {/* Overview table of all available fields */}
      <div>
        <h3 className="text-base font-bold text-gray-800 mb-3">Job Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          {job.organization     && <InfoRow label="Organization"    value={stripEmoji(job.organization)} />}
          {job.category         && <InfoRow label="Category"        value={stripEmoji(job.category)} />}
          {job.job_location     && <InfoRow label="Location"        value={stripEmoji(job.job_location)} />}
          {job.vacancies        && <InfoRow label="Total Vacancies" value={`${job.vacancies.toLocaleString()} Posts`} />}
          {job.notification_date && <InfoRow label="Notification Date" value={fmt(job.notification_date)} />}
          {job.last_date        && <InfoRow label="Last Date to Apply" value={fmt(job.last_date)} highlight={expired} />}
          {job.exam_date        && <InfoRow label="Exam Date"       value={fmt(job.exam_date)} />}
        </div>
      </div>
    </div>
  );

  const eligibilityContent = (
    <div className="space-y-4">
      {job.qualification && (
        <Section title="Educational Qualification">
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
            {stripEmoji(job.qualification)}
          </p>
        </Section>
      )}
      {job.age_limit && (
        <Section title="Age Limit">
          <p className="text-sm text-gray-700">{stripEmoji(job.age_limit)}</p>
        </Section>
      )}
    </div>
  );

  const applicationContent = (
    <div className="space-y-5">

      {/* Application Fee */}
      {feeRows.length > 0 && (
        <div>
          <h3 className="text-base font-bold text-gray-800 mb-3">Application Fee</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {feeRows.map((row, i) => (
              <div key={i} className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-center">
                <p className="text-xs text-gray-500 mb-1">{row.category}</p>
                <p className={`text-sm font-bold ${
                  row.amount.toLowerCase().includes('free') || row.amount === '0' || row.amount === 'Nil'
                    ? 'text-green-600' : 'text-blue-700'
                }`}>{row.amount || 'Nil'}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Selection Process */}
      {selSteps.length > 0 && (
        <div>
          <h3 className="text-base font-bold text-gray-800 mb-3">Selection Process</h3>
          <div className="flex flex-wrap items-center gap-2">
            {selSteps.map((step, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-4 py-2">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                    {i + 1}
                  </span>
                  <span className="text-sm font-semibold text-blue-800">{step}</span>
                </div>
                {i < selSteps.length - 1 && (
                  <span className="text-gray-300 font-bold">›</span>
                )}
              </div>
            ))}
          </div>
          </div>
      )}

      {/* How to Apply steps — always show if apply link exists */}
      {applyUrl && (
        <div>
          <h3 className="text-base font-bold text-gray-800 mb-3">How to Apply</h3>
          <ol className="space-y-2">
            {[
              `Visit the official website${siteUrl ? `: ${siteUrl}` : ''}`,
              'Register or log in with your credentials',
              'Fill in the application form with correct details',
              'Upload the required documents as specified',
              'Pay the application fee if applicable',
              'Submit the form and save the confirmation page',
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <span className="text-sm text-gray-700 pt-0.5">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );

  const datesContent = (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {job.notification_date && (
          <DateCard label="Notification Date"  date={fmt(job.notification_date)} color="blue" />
        )}
        {job.last_date && (
          <DateCard label="Last Date to Apply" date={fmt(job.last_date)}         color={expired ? 'red' : 'orange'} note={expired ? 'Deadline passed' : undefined} />
        )}
        {job.exam_date && (
          <DateCard label="Exam Date"          date={fmt(job.exam_date)}          color="green" />
        )}
        </div>
        </div>
  );

  const tabItems: TabItem[] = [];
  if (hasDetails) tabItems.push({ key: 'details', label: 'Job Details', content: detailsContent });
  if (hasEligibility) tabItems.push({ key: 'eligibility', label: 'Eligibility', content: eligibilityContent });
  if (hasApplication) tabItems.push({ key: 'application', label: 'Application Process', content: applicationContent });
  if (hasDates) tabItems.push({ key: 'dates', label: 'Important Dates', content: datesContent });

  // FAQs — only for fields that have data
  const faqs = [
    job.last_date        && { q: `What is the last date to apply?`, a: `The last date to apply is ${fmt(job.last_date)}.` },
    job.selection_process && { q: `What is the selection process?`, a: stripEmoji(selSteps.join(' > ')) || stripEmoji(job.selection_process) },
    job.age_limit        && { q: `What is the age limit?`, a: stripEmoji(job.age_limit) },
    job.application_fee  && { q: `What is the application fee?`, a: stripEmoji(job.application_fee) },
    job.qualification    && { q: `What qualification is required?`, a: stripEmoji(job.qualification).slice(0, 200) },
  ].filter(Boolean) as { q: string; a: string }[];

  return (
    <div className="min-h-screen bg-[#dde8ff]">
      <DashboardHeader />

      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 flex items-center gap-2 text-sm text-gray-500 flex-wrap">
        <Link href="/" className="hover:text-blue-600">Home</Link>
        <span>›</span>
        <Link href="/jobs" className="hover:text-blue-600">Govt Jobs</Link>
        <span>›</span>
        <span className="text-gray-700 font-medium line-clamp-1 max-w-xs">{job.title}</span>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 pb-20">
        <div className="grid grid-cols-12 gap-5">

          {/* ── Main ── */}
          <div className="col-span-12 lg:col-span-9 space-y-4">

            {/* Hero */}
            <div className="rounded-2xl overflow-hidden shadow-lg bg-gradient-to-r from-[#1d4ed8] to-[#1e40af]">
              <div className="p-4 md:p-6 flex flex-col gap-4 sm:flex-row sm:items-start">
                <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 21V7a2 2 0 012-2h4V3h6v2h4a2 2 0 012 2v14M9 21v-6h6v6" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl md:text-2xl font-extrabold text-white leading-snug break-words">{job.title}</h1>
                  <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-blue-100 text-sm">
                    <span>{job.job_location ?? STATE_LABEL[job.state] ?? 'India'}</span>
                    {job.vacancies && <span>{job.vacancies.toLocaleString()} Vacancies</span>}
                    {job.category  && <span>{job.category}</span>}
                  </div>
                </div>
                {applyUrl && !expired && (
                  <a href={applyUrl} target="_blank" rel="noopener noreferrer"
                    className="w-full sm:w-auto text-center flex-shrink-0 bg-orange-500 hover:bg-orange-400 text-white font-bold text-sm px-5 py-3 rounded-xl transition-colors shadow-md">
                    Apply Now
                  </a>
                )}
                {expired && (
                  <span className="w-full sm:w-auto text-center flex-shrink-0 bg-gray-400 text-white font-bold text-sm px-5 py-3 rounded-xl">
                    Closed
                  </span>
                )}
              </div>
            </div>

            {/* Tabs */}
            {tabItems.length > 0 && (
              <div className="bg-white rounded-2xl shadow overflow-hidden">
                <JobDetailTabs items={tabItems} />
              </div>
            )}

            {/* Bottom action buttons — only show real links */}
            {(pdfUrl || applyUrl || siteUrl) && (
              <div className="bg-white rounded-2xl shadow px-5 py-4 flex flex-wrap gap-3">
                {pdfUrl && (
                  <a href={pdfUrl} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-colors">
                    Notification PDF
                  </a>
                )}
                {siteUrl && (
                  <a href={siteUrl} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 border-2 border-gray-200 hover:border-blue-400 text-gray-700 hover:text-blue-700 text-sm font-bold px-5 py-2.5 rounded-xl transition-colors">
                    Official Website
                  </a>
                )}
                {applyUrl && !expired && (
                  <a href={applyUrl} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-colors">
                    Apply Online
                  </a>
                )}
              </div>
            )}

            {/* FAQs — only shown if there's data */}
            {faqs.length > 0 && (
              <div className="bg-white rounded-2xl shadow overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
                  <h2 className="font-extrabold text-[#1e3a8a] text-base">Frequently Asked Questions</h2>
                </div>
                <div className="divide-y divide-gray-100">
                  {faqs.map((faq, i) => (
                    <details key={i} className="group">
                      <summary className="flex items-center justify-between gap-3 px-5 py-3.5 cursor-pointer hover:bg-gray-50 list-none">
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                            {i + 1}
                          </span>
                          <span className="text-sm font-semibold text-gray-800">{faq.q}</span>
                        </div>
                        <svg className="w-4 h-4 text-gray-400 flex-shrink-0 group-open:rotate-180 transition-transform"
                          fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </summary>
                      <div className="px-5 pb-4 pl-14 text-sm text-gray-600 leading-relaxed">{faq.a}</div>
                    </details>
                  ))}
                </div>
                <div className="px-5 py-3 border-t border-gray-100">
                  <Link href="/jobs" className="text-sm text-blue-600 font-semibold hover:underline">
                    View All Jobs
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* ── Sidebar ── */}
          <div className="col-span-12 lg:col-span-3 space-y-4">

            <div className="bg-white rounded-2xl shadow border-2 border-dashed border-gray-200 h-32 flex flex-col items-center justify-center">
              <p className="text-sm font-semibold text-gray-400">Google AdSense</p>
              <p className="text-xs text-gray-300">Your ad here</p>
            </div>

            {/* Quick Info — only rows with actual data */}
            <div className="bg-white rounded-2xl shadow overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
                <h3 className="font-extrabold text-[#1e3a8a] text-base">Quick Info</h3>
              </div>
              <div className="px-5 py-4 space-y-3">
                {job.notification_date && <QuickRow label="Notification Date" value={fmt(job.notification_date)} />}
                {job.last_date         && <QuickRow label="Last Date"         value={fmt(job.last_date)} urgent={expired} />}
                {job.exam_date         && <QuickRow label="Exam Date"         value={fmt(job.exam_date)} />}
                {job.vacancies         && <QuickRow label="Total Posts"       value={`${job.vacancies.toLocaleString()}`} />}
                {job.salary            && <QuickRow label="Salary"            value={stripEmoji(job.salary)} />}
                {job.qualification     && <QuickRow label="Qualification"     value={stripEmoji(job.qualification).slice(0, 80)} />}
              </div>
              {(pdfUrl || siteUrl) && (
                <div className="px-5 pb-4 flex flex-wrap gap-2">
                  {pdfUrl && (
                    <a href={pdfUrl} target="_blank" rel="noopener noreferrer"
                      className="flex-1 text-center text-xs font-bold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 py-2 rounded-lg">
                      Notification PDF
                    </a>
                  )}
                  {siteUrl && (
                    <a href={siteUrl} target="_blank" rel="noopener noreferrer"
                      className="flex-1 text-center text-xs font-bold bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 py-2 rounded-lg">
                      Official Website
                    </a>
                  )}
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl shadow border-2 border-dashed border-gray-200 h-32 flex flex-col items-center justify-center">
              <p className="text-sm font-semibold text-gray-400">Google AdSense</p>
              <p className="text-xs text-gray-300">Your ad here</p>
            </div>
          </div>
        </div>
      </div>

      {/* Ticker */}
      <div className="fixed bottom-0 left-0 right-0 h-9 bg-[#1a2f6e] flex items-center overflow-hidden z-50">
        <div className="bg-orange-500 text-white text-xs font-extrabold px-4 h-full flex items-center flex-shrink-0">
          JOB NEWS:
        </div>
        <div className="overflow-hidden flex-1 h-full flex items-center">
          <span className="animate-marquee whitespace-nowrap text-white text-sm">
            SSC releases notification for 7,500 vacancies&nbsp;&nbsp;|&nbsp;&nbsp;
            UPSC new exam calendar out now&nbsp;&nbsp;|&nbsp;&nbsp;
            Indian Railways announces apprentice recruitment&nbsp;&nbsp;|&nbsp;&nbsp;
            APPSC Group 1 notification expected soon&nbsp;&nbsp;|&nbsp;&nbsp;
            TSPSC Group 2 results to be announced&nbsp;&nbsp;|&nbsp;&nbsp;
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
      <h4 className="text-sm font-bold text-[#1e3a8a] mb-2">{title}</h4>
      {children}
    </div>
  );
}

function InfoRow({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
      <p className="text-xs text-gray-400 uppercase tracking-wide">{label}</p>
      <p className={`mt-1 font-semibold text-sm ${highlight ? 'text-red-500' : 'text-gray-800'}`}>{value}</p>
    </div>
  );
}

function DateCard({ label, date, color, note }: {
  label: string; date: string; color: 'blue' | 'orange' | 'green' | 'red'; note?: string;
}) {
  const styles = {
    blue:   'bg-blue-50   border-blue-200   text-blue-700',
    orange: 'bg-orange-50 border-orange-200 text-orange-700',
    green:  'bg-green-50  border-green-200  text-green-700',
    red:    'bg-red-50    border-red-200    text-red-600',
  };
  return (
    <div className={`p-4 rounded-xl border-2 ${styles[color]}`}>
      <p className="text-xs font-semibold opacity-70 mb-1">{label}</p>
      <p className="font-extrabold text-sm">{date}</p>
      {note && <p className="text-xs font-bold mt-1 opacity-80">{note}</p>}
    </div>
  );
}

function QuickRow({ label, value, urgent = false }: { label: string; value: string; urgent?: boolean }) {
  return (
    <div className="flex items-start gap-2">
      <div className="min-w-0">
        <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">{label}</p>
        <p className={`text-sm font-semibold leading-tight mt-0.5 ${urgent ? 'text-red-500' : 'text-gray-800'}`}>
          {value}
        </p>
      </div>
    </div>
  );
}