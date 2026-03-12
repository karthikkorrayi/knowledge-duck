import Link from 'next/link';
import DashboardHeader from '@/components/DashboardHeader';

type JobDetails = {
  id: string;
  title: string;
  organization: string;
  state: string;
  category?: string;
  department?: string;
  last_date?: string;
  notification_date?: string;
  exam_date?: string;
  apply_link?: string;
  notification_link?: string;
  source_url?: string;
  vacancies?: number;
  created_at: string;
};

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

const STATE_LOCATION: Record<string, string> = {
  AP: 'Andhra Pradesh',
  TS: 'Telangana',
  CENTRAL: 'Across India',
};

function formatDate(iso?: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

async function fetchJob(id: string): Promise<JobDetails | null> {
  try {
    const res = await fetch(`${BASE}/api/jobs/${id}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function JobDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const job = await fetchJob(id);

  if (!job) {
    return (
      <div className="min-h-screen bg-[#dde8ff]">
        <DashboardHeader />
        <div className="max-w-6xl mx-auto px-6 py-10">
          <div className="bg-white rounded-2xl shadow p-8 text-center">
            <p className="text-2xl mb-2">🔎</p>
            <h1 className="text-xl font-bold text-gray-800">Job not found</h1>
            <p className="text-gray-500 mt-1">This job may have been removed or is no longer active.</p>
            <Link href="/jobs" className="inline-block mt-4 text-blue-600 hover:underline">
              ← Back to Jobs
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#dde8ff]">
      <DashboardHeader />

      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-2 text-sm text-gray-500">
        <Link href="/" className="hover:text-blue-600 transition-colors">Home</Link>
        <span>›</span>
        <Link href="/jobs" className="hover:text-blue-600 transition-colors">Govt Jobs</Link>
        <span>›</span>
        <span className="text-gray-700 font-medium truncate">{job.title}</span>
      </div>

      <div className="max-w-7xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-12 gap-5">
          <div className="col-span-12 lg:col-span-9 space-y-4">
            <div className="rounded-2xl shadow bg-gradient-to-r from-[#1d4ed8] to-[#1e40af] text-white p-5">
              <h1 className="text-3xl font-extrabold leading-tight">{job.title}</h1>
              <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm text-blue-100">
                <span>📍 {STATE_LOCATION[job.state] ?? 'India'}</span>
                <span>🏢 {job.organization}</span>
                <span>👥 {job.vacancies ? `${job.vacancies.toLocaleString()}+ Vacancies` : 'Vacancies not announced'}</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
                <h2 className="text-2xl font-extrabold text-[#1e3a8a]">Job Overview</h2>
              </div>

              <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <Info label="Department" value={job.department ?? job.organization} />
                <Info label="Category" value={job.category ?? 'General'} />
                <Info label="Location" value={STATE_LOCATION[job.state] ?? 'India'} />
                <Info label="Vacancies" value={job.vacancies ? `${job.vacancies.toLocaleString()}+` : 'Not specified'} />
                <Info label="Notification Date" value={formatDate(job.notification_date)} />
                <Info label="Last Date to Apply" value={formatDate(job.last_date)} />
                <Info label="Exam Date" value={formatDate(job.exam_date)} />
                <Info label="Posted On" value={formatDate(job.created_at)} />
              </div>

              <div className="p-5 pt-0 flex flex-wrap gap-3">
                {job.notification_link && (
                  <a
                    href={job.notification_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-4 py-2 rounded-lg"
                  >
                    Notification PDF
                  </a>
                )}
                {job.apply_link && (
                  <a
                    href={job.apply_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold px-4 py-2 rounded-lg"
                  >
                    Apply on Official Site
                  </a>
                )}
                {job.source_url && (
                  <a
                    href={job.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold px-4 py-2 rounded-lg"
                  >
                    Source Page
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="col-span-12 lg:col-span-3 space-y-4">
            <div className="bg-white rounded-2xl shadow border-2 border-dashed border-gray-200 h-28 flex flex-col items-center justify-center">
              <p className="text-sm font-semibold text-gray-400">Google AdSense</p>
              <p className="text-xs text-gray-300">Your ad here</p>
            </div>

            <div className="bg-white rounded-2xl shadow p-5">
              <h3 className="text-xl font-extrabold text-[#1e3a8a] mb-3">Quick Info</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li><span className="font-semibold">Organization:</span> {job.organization}</li>
                <li><span className="font-semibold">State:</span> {STATE_LOCATION[job.state] ?? job.state}</li>
                <li><span className="font-semibold">Category:</span> {job.category ?? 'General'}</li>
                <li><span className="font-semibold">Last Date:</span> {formatDate(job.last_date)}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
      <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="mt-1 font-semibold text-gray-800">{value}</p>
    </div>
  );
}