import Link from "next/link";
import DashboardHeader from "@/components/DashboardHeader";
import { fetchAllJobs } from "@/lib/supabase";

type Job = {
  id: string;
  title: string;
  department: string;
  location: string;
  last_date: string;
};

const categoryPills = [
  { label: "SSC Jobs", count: 38 },
  { label: "Bank Jobs", count: 24 },
  { label: "Railway Jobs", count: 16 },
  { label: "PSC Jobs", count: 31 },
  { label: "Police/Defense Jobs", count: 22 },
  { label: "Teachers Jobs", count: 17 },
];

function postedAgo(dateString: string) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "Recently";
  const diffDays = Math.max(1, Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24)));
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  const weeks = Math.floor(diffDays / 7);
  return `${weeks} week${weeks > 1 ? "s" : ""} ago`;
}

export default async function JobsPage() {
  const jobs: Job[] = await fetchAllJobs();

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-blue-100 via-indigo-50 to-blue-100">
      <DashboardHeader />

      <div className="border-y border-blue-200 bg-white/70 px-4 py-3 text-sm text-blue-900/90">
        <div className="mx-auto flex w-full max-w-7xl items-center gap-2">
          <Link href="/" className="hover:text-blue-700 hover:underline">
            Home
          </Link>
          <span>›</span>
          <span className="font-semibold">Government Job Listings</span>
        </div>
      </div>

      <main className="mx-auto w-full max-w-7xl flex-1 space-y-4 px-4 py-5 sm:px-5">
        <section className="rounded-2xl bg-gradient-to-r from-indigo-100 via-blue-50 to-indigo-100 px-4 py-6 text-center shadow-sm sm:px-8">
          <h1 className="text-3xl font-black text-blue-900">Browse Government Job Openings</h1>
          <p className="mt-2 text-lg text-blue-900/80">Explore the Latest Govt Jobs Notifications & Apply Now!</p>
        </section>

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2 rounded-xl bg-white/90 p-3 shadow-sm md:grid-cols-5">
              {[
                "All Categories",
                "Anywhere in India",
                "Any Qualification",
                "All Posted Dates",
              ].map((filter) => (
                <button
                  key={filter}
                  className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-left text-sm font-semibold text-blue-900 transition hover:bg-blue-100"
                >
                  {filter}
                </button>
              ))}
              <button className="rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 px-3 py-2 text-sm font-bold text-white hover:brightness-105">
                Search
              </button>
            </div>

            <div className="rounded-xl bg-white/90 p-3 shadow-sm sm:p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-blue-900">
                <p className="text-xl font-semibold">Showing {jobs.length} Job Listings</p>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Sort By:</span>
                  <select className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-sm font-semibold outline-none">
                    <option>Newest</option>
                    <option>Oldest</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                {jobs.map((job) => (
                  <article
                    key={job.id}
                    className="grid gap-3 rounded-xl border border-blue-100 bg-gradient-to-r from-white to-blue-50 p-3 shadow-sm md:grid-cols-[minmax(0,1fr)_240px] md:items-center"
                  >
                    <div>
                      <h3 className="text-xl font-extrabold text-blue-900">{job.title}</h3>
                      <p className="mt-1 text-sm text-blue-800/80">
                        📍 {job.location} &nbsp;|&nbsp; 🏢 {job.department}
                      </p>
                      <p className="mt-2 text-sm font-semibold text-blue-900/80">Posted: {postedAgo(job.last_date)}</p>
                    </div>
                    <div className="flex items-center justify-between gap-3 md:justify-end">
                      <span className="rounded-md bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">Apply before {job.last_date}</span>
                      <button className="rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-2.5 text-base font-bold text-white shadow hover:brightness-105">
                        Apply Now
                      </button>
                    </div>
                  </article>
                ))}
              </div>

              <div className="mt-4 flex items-center justify-center gap-2 text-sm font-semibold text-blue-800">
                {[
                  "1",
                  "2",
                  "3",
                  "4",
                ].map((p, index) => (
                  <button
                    key={p}
                    className={`h-8 w-8 rounded-md border ${index === 0 ? "border-blue-700 bg-blue-700 text-white" : "border-blue-200 bg-white hover:bg-blue-50"}`}
                  >
                    {p}
                  </button>
                ))}
                <button className="rounded-md border border-blue-200 bg-white px-3 py-1.5 hover:bg-blue-50">Last »</button>
              </div>
            </div>
          </div>

          <aside className="space-y-3">
            <div className="rounded-xl border border-dashed border-blue-200 bg-white p-6 text-center text-gray-500 shadow-sm">
              Google AdSense<br />Your ad here
            </div>

            <div className="rounded-xl bg-white/90 p-4 shadow-sm">
              <h3 className="mb-3 text-3xl font-extrabold text-blue-900">Popular Categories</h3>
              <ul className="space-y-2">
                {categoryPills.map((category) => (
                  <li key={category.label} className="flex items-center justify-between rounded-lg border border-blue-100 px-3 py-2 text-blue-900">
                    <span className="font-semibold">{category.label}</span>
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-sm font-bold text-blue-700">{category.count}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl bg-white/90 p-4 shadow-sm">
              <h3 className="mb-3 text-2xl font-extrabold text-blue-900">Job Alerts & Resources</h3>
              <ul className="divide-y divide-blue-100">
                {[
                  "Download Exam Syllabus PDFs",
                  "Practice Mock Tests",
                  "Interview Preparation Tips",
                ].map((item) => (
                  <li key={item}>
                    <a href="#" className="flex items-center justify-between py-3 font-semibold text-blue-900 hover:text-blue-700">
                      <span>{item}</span>
                      <span>›</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}