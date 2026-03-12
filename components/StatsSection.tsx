// Matches the original dashboard design:
// Orange | Blue | Green | Purple — white text, large number, small label

type StatsSectionProps = {
  newGovtJobs:   number;
  upcomingExams: number;
  activeJobs:    number;
  departments:   number;
};

export default function StatsSection({
  newGovtJobs,
  upcomingExams,
  activeJobs,
  departments,
}: StatsSectionProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

      <StatCard
        label="NEW GOVT JOBS"
        value={newGovtJobs}
        className="bg-orange-500"
      />

      <StatCard
        label="UPCOMING EXAMS"
        value={upcomingExams}
        className="bg-blue-600"
      />

      <StatCard
        label="ACTIVE JOBS"
        value={activeJobs}
        className="bg-emerald-500"
      />

      <StatCard
        label="DEPARTMENTS"
        value={`${departments}+`}
        className="bg-gradient-to-br from-violet-600 to-purple-700"
      />

    </div>
  );
}

function StatCard({
  label,
  value,
  className,
}: {
  label: string;
  value: number | string;
  className: string;
}) {
  return (
    <div className={`${className} rounded-2xl px-6 py-5 text-white`}>
      <p className="text-xs font-semibold tracking-widest uppercase opacity-90">
        {label}
      </p>
      <p className="text-5xl font-extrabold mt-2 leading-none">
        {value}
      </p>
    </div>
  );
}