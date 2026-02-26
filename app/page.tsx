import DashboardHeader from "@/components/DashboardHeader";
import { fetchJobs, fetchJobStats, fetchUpcomingExams } from "@/lib/supabase";

function CalendarIcon() {
  return (
    <svg className="h-5 w-5 flex-shrink-0 text-blue-500" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" />
      <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeLinecap="round" />
    </svg>
  );
}

function DocIcon() {
  return (
    <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" />
      <polyline points="14 2 14 8 20 8" stroke="currentColor" />
      <line x1="9" y1="13" x2="15" y2="13" stroke="currentColor" strokeLinecap="round" />
      <line x1="9" y1="17" x2="13" y2="17" stroke="currentColor" strokeLinecap="round" />
    </svg>
  );
}

type Job = {
  id: string;
  title: string;
  location: string;
  qualification?: string;
  department?: string;
};

type Exam = {
  id: string;
  name: string;
  exam_date: string;
  status: string;
};

function formatDate(rawDate: string) {
  const date = new Date(rawDate);
  if (Number.isNaN(date.getTime())) return "TBA";
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export default async function HomePage() {
  const [jobs, stats, exams] = await Promise.all([fetchJobs(), fetchJobStats(), fetchUpcomingExams()]);
  const topJobs: Job[] = jobs.slice(0, 4);
  const upcomingExams: Exam[] = exams.slice(0, 4);

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-blue-50 to-slate-100">
      <DashboardHeader />

      <main className="mx-auto w-full max-w-7xl flex-1 space-y-4 px-3 py-4 sm:px-5 sm:py-5">
        <h1 className="text-center text-xl font-black leading-tight text-blue-900 sm:text-2xl lg:text-[1.7rem]">
          Explore Latest Government Job Updates
        </h1>

        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="rounded-xl bg-gradient-to-br from-orange-500 to-orange-400 p-4 text-white shadow-md">
            <p className="text-[11px] font-semibold uppercase">New Govt Jobs</p>
            <p className="mt-2 text-3xl font-black">{stats.total || 0}</p>
          </div>
          <div className="rounded-xl bg-gradient-to-br from-blue-600 to-blue-500 p-4 text-white shadow-md">
            <p className="text-[11px] font-semibold uppercase">Upcoming Exams</p>
            <p className="mt-2 text-3xl font-black">{stats.upcomingExams || 0}</p>
          </div>
          <div className="rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-500 p-4 text-white shadow-md">
            <p className="text-[11px] font-semibold uppercase">Active Jobs</p>
            <p className="mt-2 text-3xl font-black">{stats.active || 0}</p>
          </div>
          <div className="rounded-xl bg-gradient-to-br from-indigo-700 to-indigo-600 p-4 text-white shadow-md">
            <p className="text-[11px] font-semibold uppercase">Departments</p>
            <p className="mt-2 text-3xl font-black">15+</p>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          <div className="overflow-hidden rounded-xl bg-white shadow-md">
            <div className="bg-blue-700 px-4 py-2.5 text-sm font-bold text-white">Latest Govt Job Notifications</div>
            <div className="divide-y divide-gray-100">
              {topJobs.map((job) => (
                <div key={job.id} className="flex items-start gap-3 px-4 py-3 hover:bg-blue-50">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-700">🏛️</div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-gray-900">{job.title}</p>
                    <p className="mt-0.5 text-xs text-gray-500">{job.location} • {job.qualification || job.department || "Qualification N/A"}</p>
                  </div>
                  <button className="rounded-md bg-orange-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-orange-600">Apply</button>
                </div>
              ))}
            </div>
            <div className="border-t bg-gray-50 p-3 text-center">
              <a href="/jobs" className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 px-5 py-2 text-sm font-bold text-white hover:bg-blue-800">
                View All Jobs ›
              </a>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div className="rounded-xl bg-white p-4 shadow-md">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-base font-extrabold text-gray-900">Upcoming Exams</h3>
                <a href="#" className="text-sm font-semibold text-blue-600 hover:underline">View All</a>
              </div>
              <div className="space-y-2">
                {upcomingExams.map((exam) => (
                  <div key={exam.id} className="flex items-start gap-2.5 rounded-lg border border-gray-200 px-3 py-2.5">
                    <CalendarIcon />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-bold text-blue-700">{exam.name}</span>
                        <span className="text-xs font-medium text-gray-500">{formatDate(exam.exam_date)}</span>
                      </div>
                      <div className="text-xs text-gray-500">{exam.status}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex min-h-32 items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white text-sm text-gray-500 shadow-md">
              Mobile Ad Slot
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex min-h-28 items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white text-sm text-gray-500 shadow-md">
              Top Right Ad Slot
            </div>
            <div className="rounded-xl bg-white p-4 shadow-md">
              <h3 className="mb-2 text-base font-extrabold text-gray-900">Resources</h3>
              <div className="divide-y divide-gray-100">
                {["Exam Syllabus PDFs", "Practice Mock Tests", "Interview Tips"].map((label) => (
                  <a key={label} href="#" className="group flex items-center justify-between py-2.5">
                    <div className="flex items-center gap-2.5">
                      <DocIcon />
                      <span className="text-sm font-semibold text-gray-800 group-hover:text-blue-700">{label}</span>
                    </div>
                    <span className="text-gray-400 group-hover:text-blue-600">›</span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      <div className="flex items-center overflow-hidden bg-blue-900 text-white" style={{ minHeight: "2.6rem" }}>
        <div className="self-stretch bg-orange-500 px-3 py-2 text-xs font-extrabold tracking-wide sm:px-4 sm:text-sm">JOB NEWS:</div>
        <div className="flex-1 overflow-hidden px-3">
          <span className="animate-marquee whitespace-nowrap text-xs font-medium text-yellow-100 sm:text-sm">
            SSC releases new vacancies • Indian Railways announces apprentice recruitment • UPSC Civil Services notification out • DRDO recruitment open
          </span>
        </div>
      </div>
    </div>
  );
}