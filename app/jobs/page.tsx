// Server Component: reads searchParams → fetches filtered data → renders.
// Filters and pagination are Client Components that update the URL,
// which causes this Server Component to re-run with new params.

import Link from 'next/link';
import { Suspense } from 'react';
import DashboardHeader from '@/components/DashboardHeader';
import JobCard from '@/components/JobCard';
import JobsFilterBar from '@/components/JobsFilterBar';
import JobsPagination from '@/components/JobsPagination';
import JobsSortSelect from '@/components/JobsSortSelect';

// ── Types ─────────────────────────────────────────────────────────
interface Job {
  id:                 string;
  title:              string;
  organization:       string;
  state:              string;
  category?:          string;
  last_date?:         string;
  notification_link?: string;
  apply_link?:        string;
  source_url?:        string;
  vacancies?:         number;
  created_at:         string;
}
interface JobsResponse {
  jobs:       Job[];
  total:      number;
  page:       number;
  totalPages: number;
}

// ── Data fetchers ─────────────────────────────────────────────────
const BASE = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

async function fetchJobs(params: Record<string, string>): Promise<JobsResponse> {
  try {
    const qs = new URLSearchParams(params).toString();
    // no-store so every navigation gets fresh data (not cached from page 1)
    const res = await fetch(`${BASE}/api/jobs?${qs}`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`${res.status}`);
    return res.json();
  } catch (e) {
    console.error('[jobs page] fetch error:', e);
    return { jobs: [], total: 0, page: 1, totalPages: 0 };
  }
}

async function fetchCategories(): Promise<{ category: string; count: number }[]> {
  try {
    const res = await fetch(`${BASE}/api/jobs/categories`, { next: { revalidate: 600 } });
    if (!res.ok) throw new Error();
    return res.json();
  } catch {
    return [
      { category: 'SSC Jobs',           count: 0 },
      { category: 'Bank Jobs',           count: 0 },
      { category: 'Railway Jobs',        count: 0 },
      { category: 'PSC Jobs',            count: 0 },
      { category: 'Police/Defense Jobs', count: 0 },
      { category: 'Teachers Jobs',       count: 0 },
    ];
  }
}

// ── Helpers ───────────────────────────────────────────────────────
function formatDate(iso?: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

function timeAgo(iso?: string): string {
  if (!iso) return '';
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (d === 0)  return 'Today';
  if (d === 1)  return '1 day ago';
  if (d < 30)   return `${d} days ago`;
  return '1 month ago';
}

const STATE_LOCATION: Record<string, string> = {
  AP:      'Andhra Pradesh',
  TS:      'Telangana',
  CENTRAL: 'Across India',
};

const CATEGORY_ICONS: Record<string, string> = {
  'SSC Jobs':           '🏛️',
  'Bank Jobs':          '🏦',
  'Railway Jobs':       '🚂',
  'PSC Jobs':           '📋',
  'Police/Defense Jobs':'🛡️',
  'Teachers Jobs':      '📚',
  'Engineering Jobs':   '⚙️',
  'Medical Jobs':       '🏥',
  'PSU Jobs':           '🏭',
  'Clerk Jobs':         '🖊️',
};

// ── Page ──────────────────────────────────────────────────────────
// searchParams come from the URL — updated by the client filter components
type JobsPageSearchParams = {
  page?:     string;
  state?:    string;
  category?: string;
  search?:   string;
  qual?:     string;
  days?:     string;
  sort?:     string;
};

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<JobsPageSearchParams>;
}) {
  const params = await searchParams;

  // Build params object — only include non-empty values
  const apiParams: Record<string, string> = { limit: '10' };
  if (params.page)     apiParams.page     = params.page;
  if (params.state)    apiParams.state    = params.state;
  if (params.category) apiParams.category = params.category;
  if (params.search)   apiParams.search   = params.search;
  if (params.qual)     apiParams.qual     = params.qual;
  if (params.days)     apiParams.days     = params.days;
  if (params.sort)     apiParams.sort     = params.sort;

  const currentPage = parseInt(params.page ?? '1', 10);

  const buildJobsUrl = (overrides: Partial<JobsPageSearchParams>) => {
    const merged: JobsPageSearchParams = { ...params, ...overrides };
    const qs = new URLSearchParams();

    if (merged.state) qs.set('state', merged.state);
    if (merged.category) qs.set('category', merged.category);
    if (merged.search) qs.set('search', merged.search);
    if (merged.qual) qs.set('qual', merged.qual);
    if (merged.days) qs.set('days', merged.days);
    if (merged.sort) qs.set('sort', merged.sort);

    return qs.toString() ? `/jobs?${qs.toString()}` : '/jobs';
  };

  const [{ jobs, total, totalPages }, categories] = await Promise.all([
    fetchJobs(apiParams),
    fetchCategories(),
  ]);

  return (
    <div className="min-h-screen bg-[#dde8ff]">
      <DashboardHeader />

      {/* Breadcrumb */}
      <div className="px-6 py-3 flex items-center gap-2 text-sm text-gray-500">
        <Link href="/" className="hover:text-blue-600 transition-colors">Home</Link>
        <span>›</span>
        <span className="text-gray-700 font-medium">Government Job Listings</span>
      </div>

      <div className="px-6 pb-20">
        <div className="grid grid-cols-12 gap-5">

          {/* ── Main content ── */}
          <div className="col-span-12 lg:col-span-9">

            {/* Hero */}
            <div className="text-center py-5">
              <h1 className="text-3xl font-extrabold text-[#1e3a8a]">
                Browse Government Job Openings
              </h1>
              <p className="text-gray-500 mt-1 text-sm">
                Explore the Latest Govt Jobs Notifications &amp; Apply Now!
              </p>
            </div>

            {/* ── Filter bar (Client Component) ── */}
            {/* Wrapped in Suspense because it uses useSearchParams() */}
            <Suspense fallback={<div className="bg-white rounded-2xl shadow p-4 mb-4 h-16 animate-pulse" />}>
              <JobsFilterBar />
            </Suspense>

            {/* Results header */}
            <div className="flex items-center justify-between mb-3 px-1">
              <p className="font-bold text-gray-700 text-sm">
                Showing{' '}
                <span className="text-blue-700">{total.toLocaleString()}</span>{' '}
                Job Listing{total !== 1 ? 's' : ''}
                {params.state && (
                  <span className="ml-1 text-gray-400 font-normal">
                    in {STATE_LOCATION[params.state] ?? params.state}
                  </span>
                )}
                {params.category && (
                  <span className="ml-1 text-gray-400 font-normal">
                    — {params.category}
                  </span>
                )}
              </p>
              {/* Sort dropdown */}
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span>Sort By:</span>
                <Suspense fallback={null}>
                  <JobsSortSelect currentSort={params.sort ?? 'newest'} />
                </Suspense>
              </div>
            </div>

            {/* Job list */}
            <div className="bg-white rounded-2xl shadow divide-y divide-gray-100 overflow-hidden mb-4">
              {jobs.length === 0 ? (
                <div className="py-20 text-center">
                  <p className="text-4xl mb-3">🔍</p>
                  <p className="text-gray-500 font-medium">No jobs found for these filters.</p>
                  <p className="text-gray-400 text-sm mt-1">
                    Try clearing some filters or run <code className="bg-gray-100 px-1 rounded">npm run scrape</code>
                  </p>
                  <Link href="/jobs" className="inline-block mt-4 text-blue-600 text-sm hover:underline">
                    Clear all filters →
                  </Link>
                </div>
              ) : (
                jobs.map((job, i) => (
                  <div key={job.id} className="px-5">
                    <JobCard
                      id={job.id}
                      title={job.title}
                      department={job.organization}
                      location={STATE_LOCATION[job.state] ?? 'India'}
                      last_date={formatDate(job.last_date)}
                      vacancies={job.vacancies}
                      category={job.category}
                      jobType={
                        job.category === 'Railway Jobs' ? 'Apprenticeship' :
                        job.category === 'Police/Defense Jobs' ? 'Full-Time' :
                        'Full-Time'
                      }
                      postedAt={timeAgo(job.created_at)}
                      isTrending={i < 2 && currentPage === 1}
                    />
                  </div>
                ))
              )}
            </div>

            {/* Pagination (Client Component — preserves filter params) */}
            <Suspense fallback={null}>
              <JobsPagination currentPage={currentPage} totalPages={totalPages} />
            </Suspense>

          </div>

          {/* ── Sidebar ── */}
          <div className="col-span-12 lg:col-span-3 flex flex-col gap-5">

            {/* Ad slot */}
            <div className="bg-white rounded-2xl shadow border-2 border-dashed border-gray-200 h-28 flex flex-col items-center justify-center">
              <p className="text-sm font-semibold text-gray-400">Google AdSense</p>
              <p className="text-xs text-gray-300">Your ad here</p>
            </div>

            {/* Popular Categories */}
            <div className="bg-white rounded-2xl shadow p-5">
              <h2 className="text-lg font-extrabold text-[#1e3a8a] mb-4">Popular Categories</h2>
              <div className="space-y-0.5">
                {categories.map((cat) => (
                  <Link
                    key={cat.category}
                    href={buildJobsUrl({ category: cat.category, page: undefined })}
                    className={`flex items-center justify-between py-2.5 px-3 rounded-xl transition-colors group ${
                      params.category === cat.category
                        ? 'bg-blue-600 text-white'
                        : 'hover:bg-blue-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-base">{CATEGORY_ICONS[cat.category] ?? '📌'}</span>
                      <span className={`text-sm font-semibold ${
                        params.category === cat.category
                          ? 'text-white'
                          : 'text-gray-700 group-hover:text-blue-700'
                      }`}>
                        {cat.category}
                      </span>
                    </div>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full min-w-[32px] text-center ${
                      params.category === cat.category
                        ? 'bg-white text-blue-600'
                        : 'bg-blue-600 text-white'
                    }`}>
                      {cat.count}
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            {/* State quick filters */}
            <div className="bg-white rounded-2xl shadow p-5">
              <h2 className="text-base font-extrabold text-[#1e3a8a] mb-3">Browse by State</h2>
              {[
                { value: 'AP',      label: '🏛 Andhra Pradesh' },
                { value: 'TS',      label: '🏙 Telangana' },
                { value: 'CENTRAL', label: '🇮🇳 Central Government' },
              ].map((s) => (
                <Link
                  key={s.value}
                  href={buildJobsUrl({ state: s.value, page: undefined })}
                  className={`flex items-center justify-between py-2.5 border-b border-gray-100 last:border-0 transition-colors group ${
                    params.state === s.value ? 'text-blue-600 font-bold' : 'hover:text-blue-600'
                  }`}
                >
                  <span className="text-sm">{s.label}</span>
                  <span className="text-gray-400">›</span>
                </Link>
              ))}
            </div>

            {/* Resources */}
            <div className="bg-white rounded-2xl shadow p-5">
              <h2 className="text-base font-extrabold text-[#1e3a8a] mb-3">
                Job Alerts &amp; Resources
              </h2>
              {[
                { icon: '📄', label: 'Download Exam Syllabus PDFs', href: '/resources/syllabus' },
                { icon: '✅', label: 'Practice Mock Tests',          href: '/resources/mock-tests' },
                { icon: '💡', label: 'Interview Preparation Tips',  href: '/resources/interview' },
              ].map((r) => (
                <Link key={r.href} href={r.href}
                  className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0 hover:text-blue-600 transition-colors group">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{r.icon}</span>
                    <span className="text-sm text-gray-700 group-hover:text-blue-600">{r.label}</span>
                  </div>
                  <span className="text-gray-400">›</span>
                </Link>
              ))}
              <Link href="/jobs" className="block mt-3 text-center text-sm text-blue-600 font-semibold hover:underline">
                View More ›
              </Link>
            </div>

          </div>
        </div>
      </div>

      {/* JOB NEWS ticker */}
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