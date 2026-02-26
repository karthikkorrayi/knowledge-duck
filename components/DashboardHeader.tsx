export default function DashboardHeader() {
  return (
    <header className="border-b bg-white/95 shadow-sm backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-3 py-3 sm:px-5 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-blue-700">
            <span className="text-xl text-white">🎓</span>
          </div>
          <h1 className="text-base font-bold text-blue-800 sm:text-lg">Govt Jobs for Students</h1>
        </div>

        <div className="flex w-full flex-col gap-2 sm:flex-row md:w-auto md:flex-1 md:items-center md:justify-end md:pl-6">
          <div className="relative w-full md:max-w-xl">
            <input
              type="text"
              placeholder="Search government jobs..."
              className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none"
            />
            <svg
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>

          <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 sm:w-auto">
            Get Job Alerts
          </button>
        </div>
      </div>
    </header>
  );
}