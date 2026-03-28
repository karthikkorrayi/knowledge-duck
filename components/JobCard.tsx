import Link from 'next/link';

// Matches the richer card design from screenshot 2:
// Org logo | Title + badge | Location + type | Vacancies + time | View Details button
type JobCardProps = {
  id:         string;
  title:      string;
  department: string;    // organization name
  location:   string;    // e.g. "Hyderabad" or "All India"
  last_date:  string;    // formatted date string
  vacancies?: number;
  category?:  string;
  jobType?:   string;    // "Full-Time" | "Apprenticeship" | "Contract" etc
  postedAt?:  string;    // e.g. "2 days ago"
  isTrending?: boolean;
};

export default function JobCard({
  id,
  title,
  location,
  last_date,
  vacancies,
  jobType = 'Full-Time',
  postedAt,
  isTrending = false,
}: JobCardProps) {
  return (
    <div className="py-3">
      <div className="flex items-start gap-3 md:hidden">
        <div className="flex-shrink-0 w-11 h-11 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 border border-blue-200 flex items-center justify-center overflow-hidden">
          <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M3 21V7a2 2 0 012-2h4V3h6v2h4a2 2 0 012 2v14M9 21v-6h6v6" />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2">
            <h3 className="text-base font-bold text-gray-800 leading-snug line-clamp-3">{title}</h3>
            {isTrending && (
              <span className="bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide whitespace-nowrap">
                Trending
              </span>
            )}
          </div>
          <div className="mt-2 space-y-1.5">
            <p className="text-xs text-gray-500">{location}</p>
            <div className="flex flex-wrap items-center gap-2 text-xs text-gray-400">
              {jobType && <span>{jobType}</span>}
              {last_date && last_date !== '—' && <span className="text-red-500 font-medium">Last: {last_date}</span>}
              {postedAt && <span>{postedAt}</span>}
              {vacancies && <span className="font-semibold text-gray-600">{vacancies.toLocaleString()}+ posts</span>}
            </div>
          </div>
          <Link
            href={`/jobs/${id}`}
            className="mt-3 inline-flex bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold px-4 py-2 rounded-lg transition-colors items-center gap-1"
          >
            View Details <span>›</span>
          </Link>
        </div>
      </div>

      <div className="hidden items-center gap-4 md:flex">
        {/* Org logo circle */}
        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 border-2 border-blue-200 flex items-center justify-center overflow-hidden">
          <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M3 21V7a2 2 0 012-2h4V3h6v2h4a2 2 0 012 2v14M9 21v-6h6v6" />
          </svg>
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Title + Trending badge */}
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base font-bold text-gray-800 leading-tight">
              {title}
            </h3>
            {isTrending && (
              <span className="bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide">
                Trending
              </span>
            )}
          </div>

          {/* Location + type */}
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <svg className="w-3 h-3 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              {location}
            </span>
            {jobType && (
              <span className="text-xs text-gray-400">| {jobType}</span>
            )}
            {last_date && last_date !== '—' && (
              <span className="text-xs text-red-500 font-medium">Last: {last_date}</span>
            )}
          </div>
        </div>

        {/* Right side: vacancies + time + View Details */}
        <div className="flex-shrink-0 flex flex-col items-end gap-2">
          <div className="text-right">
            {vacancies && (
              <p className="text-sm font-bold text-gray-700">
                <span className="flex items-center gap-1 justify-end">
                  <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0" />
                  </svg>
                  {vacancies.toLocaleString()}+
                </span>
              </p>
            )}
            {postedAt && (
              <p className="text-xs text-gray-400 mt-0.5">{postedAt}</p>
            )}
          </div>
          <Link
            href={`/jobs/${id}`}
            className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors flex items-center gap-1 whitespace-nowrap"
          >
            View Details <span>›</span>
          </Link>
        </div>
      </div>
    </div>
  );
}