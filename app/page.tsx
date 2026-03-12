import Link from 'next/link';
import DashboardHeader from '@/components/DashboardHeader';

// ── Types ─────────────────────────────────────────────────────────
interface Stats {
  new_govt_jobs:  number;
  upcoming_exams: number;
  active_jobs:    number;
  departments:    number;
}
interface Job {
  id: string; title: string; organization: string; state: string;
  category?: string; last_date?: string; notification_link?: string;
  apply_link?: string; vacancies?: number; source_url?: string;
}
interface Exam {
  id: string; title: string; organization: string; state: string;
  exam_date?: string; notification_link?: string;
}

// ── Fetchers ──────────────────────────────────────────────────────
const BASE = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

async function fetchStats(): Promise<Stats> {
  try {
    const res = await fetch(`${BASE}/api/stats`, { next: { revalidate: 60 } });
    if (!res.ok) throw new Error();
    return res.json();
  } catch { return { new_govt_jobs: 0, upcoming_exams: 0, active_jobs: 0, departments: 15 }; }
}
async function fetchJobs(): Promise<Job[]> {
  try {
    const res = await fetch(`${BASE}/api/jobs?limit=6`, { next: { revalidate: 300 } });
    if (!res.ok) throw new Error();
    return (await res.json()).jobs ?? [];
  } catch { return []; }
}
async function fetchExams(): Promise<Exam[]> {
  try {
    const res = await fetch(`${BASE}/api/exams?limit=4`, { next: { revalidate: 300 } });
    if (!res.ok) throw new Error();
    return (await res.json()).exams ?? [];
  } catch { return []; }
}

function timeAgo(iso?: string): string {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const d = Math.floor(diff / 86400000);
  if (d === 0) return 'Today';
  if (d === 1) return '1 day ago';
  if (d < 30) return `${d} days ago`;
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

function formatExamDate(iso?: string): string {
  if (!iso) return 'TBA';
  return new Date(iso).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
}

// ── State label ───────────────────────────────────────────────────
const STATE_LABEL: Record<string, string> = {
  AP: 'Andhra Pradesh', TS: 'Telangana', CENTRAL: 'All India',
};

// ── Page ──────────────────────────────────────────────────────────
export default async function HomePage() {
  const [stats, jobs, exams] = await Promise.all([fetchStats(), fetchJobs(), fetchExams()]);

  return (
    <div className="min-h-screen bg-[#dde8ff] flex flex-col">
      <DashboardHeader />

      {/* ── Hero ── */}
      <div className="text-center py-7 px-4">
        <h1 className="text-3xl font-extrabold text-[#1e3a8a]">
          Welcome, Student! Explore Latest Govt Job Updates
        </h1>
      </div>

      {/* ── Stat cards ── */}
      <div className="px-6 pb-5 grid grid-cols-2 lg:grid-cols-4 gap-4">

        {/* New Govt Jobs */}
        <div className="bg-gradient-to-br from-orange-400 to-orange-500 rounded-2xl p-5 text-white flex items-center gap-4 shadow">
          <div className="bg-white/20 rounded-xl p-3">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M3 21V7a2 2 0 012-2h4V3h6v2h4a2 2 0 012 2v14M9 21v-6h6v6" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-medium opacity-90 leading-tight">New Govt Jobs<br/>Today:</p>
            <p className="text-4xl font-black leading-none mt-0.5">{stats.new_govt_jobs}</p>
          </div>
        </div>

        {/* Upcoming Exams */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl p-5 text-white flex items-center gap-4 shadow">
          <div className="bg-white/20 rounded-xl p-3">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-medium opacity-90 leading-tight">Upcoming<br/>Exams:</p>
            <p className="text-4xl font-black leading-none mt-0.5">{stats.upcoming_exams}</p>
          </div>
        </div>

        {/* Active Jobs */}
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-5 text-white flex items-center gap-4 shadow">
          <div className="bg-white/20 rounded-xl p-3">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-medium opacity-90 leading-tight">Active<br/>Jobs:</p>
            <p className="text-4xl font-black leading-none mt-0.5">{stats.active_jobs}</p>
          </div>
        </div>

        {/* Top Companies */}
        <div className="bg-gradient-to-br from-violet-600 to-purple-800 rounded-2xl p-5 text-white flex items-center gap-4 shadow">
          <div className="bg-white/20 rounded-xl p-3">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-medium opacity-90 leading-tight">Top Companies<br/>Hiring</p>
            <p className="text-sm font-bold leading-snug mt-0.5">Army &bull; SSC &bull; SBI</p>
          </div>
        </div>
      </div>

      {/* ── Main grid ── */}
      <div className="px-6 pb-20 grid grid-cols-12 gap-5">

        {/* ── Left: Latest Notifications ── */}
        <div className="col-span-12 md:col-span-4 bg-white rounded-2xl shadow overflow-hidden flex flex-col">
          <div className="bg-[#1d4ed8] px-5 py-4">
            <h2 className="text-white font-bold text-base">Latest Govt Job Notifications</h2>
          </div>

          <div className="flex-1 divide-y divide-gray-100">
            {jobs.length === 0 ? (
              <p className="p-8 text-center text-sm text-gray-400">
                Run <code className="bg-gray-100 px-1 rounded">npm run scrape</code> to populate jobs.
              </p>
            ) : (
              jobs.map((job) => (
                <div key={job.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                  {/* Org icon */}
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 border-2 border-blue-200 flex items-center justify-center overflow-hidden">
                    <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" />
                    </svg>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-800 leading-tight line-clamp-1">{job.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">
                      {STATE_LABEL[job.state] ?? job.state}
                      {job.vacancies ? ` | ${job.vacancies.toLocaleString()}+ Vacancies` : ''}
                      {job.category ? ` | ${job.category}` : ''}
                    </p>
                  </div>

                  {/* Apply button */}
                  <a
                    href={job.apply_link ?? job.notification_link ?? job.source_url ?? '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-shrink-0 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors whitespace-nowrap"
                  >
                    Apply Now
                  </a>
                </div>
              ))
            )}
          </div>

          <div className="border-t border-gray-100 px-5 py-4 text-center">
            <Link
              href="/jobs"
              className="inline-flex items-center gap-2 bg-[#1d4ed8] hover:bg-blue-700 text-white text-sm font-bold px-7 py-2.5 rounded-xl transition-colors"
            >
              View All Govt Jobs <span>›</span>
            </Link>
          </div>
        </div>

        {/* ── Middle: Upcoming Exams + Ad ── */}
        <div className="col-span-12 md:col-span-5 flex flex-col gap-4">
          <div className="bg-white rounded-2xl shadow overflow-hidden flex-1">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-800 text-base">Upcoming Exams</h2>
              <Link href="/exams" className="text-sm text-blue-600 hover:underline font-semibold flex items-center gap-1">
                View All <span>›</span>
              </Link>
            </div>

            {exams.length === 0 ? (
              <div className="m-4 border-2 border-dashed border-gray-200 rounded-xl h-36 flex items-center justify-center">
                <p className="text-sm text-gray-400">No upcoming exams yet</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {exams.map((exam) => (
                  <div key={exam.id} className="flex items-center gap-3 px-5 py-3">
                    {/* Calendar icon */}
                    <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
                      <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{exam.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{exam.organization}</p>
                    </div>
                    {exam.exam_date && (
                      <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded-lg flex-shrink-0">
                        {formatExamDate(exam.exam_date)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* View Exam Calendar button */}
            <div className="px-5 pb-4 mt-2">
              <Link
                href="/exams"
                className="block w-full text-center bg-[#1d4ed8] hover:bg-blue-700 text-white text-sm font-bold py-2.5 rounded-xl transition-colors"
              >
                View Exam Calendar ›
              </Link>
            </div>
          </div>

          {/* Mobile Ad Slot */}
          <div className="bg-white rounded-2xl shadow border border-dashed border-gray-200 h-32 flex flex-col items-center justify-center">
            <p className="text-sm font-semibold text-gray-400">Google AdSense</p>
            <p className="text-xs text-gray-300 mt-1">Your ad here</p>
          </div>
        </div>

        {/* ── Right: Ad + Resources + Ad ── */}
        <div className="col-span-12 md:col-span-3 flex flex-col gap-4">
          {/* Top Ad */}
          <div className="bg-white rounded-2xl shadow border border-dashed border-gray-200 h-32 flex flex-col items-center justify-center">
            <p className="text-sm font-semibold text-gray-400">Google AdSense</p>
            <p className="text-xs text-gray-300 mt-1">Your ad here</p>
          </div>

          {/* Resources */}
          <div className="bg-white rounded-2xl shadow p-5 flex-1">
            <h2 className="font-bold text-gray-800 text-base mb-3">Resources</h2>
            {[
              { icon: '📄', label: 'Exam Syllabus PDFs',  href: '/resources/syllabus' },
              { icon: '✅', label: 'Practice Mock Tests', href: '/resources/mock-tests' },
              { icon: '💡', label: 'Interview Tips →',    href: '/resources/interview' },
            ].map((r) => (
              <Link
                key={r.href}
                href={r.href}
                className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0 hover:text-blue-600 transition-colors group"
              >
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded bg-blue-50 flex items-center justify-center text-sm">{r.icon}</div>
                  <span className="text-sm text-gray-700 group-hover:text-blue-600">{r.label}</span>
                </div>
                <span className="text-gray-400">›</span>
              </Link>
            ))}
          </div>

          {/* Bottom Ad */}
          <div className="bg-white rounded-2xl shadow border border-dashed border-gray-200 h-32 flex flex-col items-center justify-center">
            <p className="text-sm font-semibold text-gray-400">Google AdSense</p>
            <p className="text-xs text-gray-300 mt-1">Your ad here</p>
          </div>
        </div>

      </div>

      {/* ── JOB NEWS ticker ── */}
      <div className="fixed bottom-0 left-0 right-0 h-9 bg-[#1a2f6e] flex items-center overflow-hidden z-50">
        <div className="bg-orange-500 text-white text-xs font-extrabold px-4 h-full flex items-center flex-shrink-0 tracking-wide">
          JOB NEWS:
        </div>
        <div className="overflow-hidden flex-1 h-full flex items-center">
          <span className="animate-marquee whitespace-nowrap text-white text-sm">
            SSC releases notification for 7,500 vacancies&nbsp;&nbsp;|&nbsp;&nbsp;
            Indian Railways announces apprentice recruitment&nbsp;&nbsp;|&nbsp;&nbsp;
            UPSC Civil Services notification out — apply by April 15&nbsp;&nbsp;|&nbsp;&nbsp;
            DRDO Technical Assistant Jobs open&nbsp;&nbsp;|&nbsp;&nbsp;
            APPSC Group 1 notification expected soon&nbsp;&nbsp;|&nbsp;&nbsp;
            TSPSC Group 2 results to be announced&nbsp;&nbsp;|&nbsp;&nbsp;
            RBI Assistant 650 posts — last date approaching&nbsp;&nbsp;|&nbsp;&nbsp;
          </span>
        </div>
      </div>
    </div>
  );
}