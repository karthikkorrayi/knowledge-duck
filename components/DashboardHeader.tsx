import Image from "next/image";
import Link from "next/link";

export default function DashboardHeader() {
  const navItems = [
    { href: "/#latest-notifications", label: "Notifications" },
    { href: "/#upcoming-exams", label: "Exams" },
    { href: "/#resources", label: "Resources" },
  ];

  return (
    <header className="border-b bg-white/95 shadow-sm backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl flex-col px-3 py-3 sm:px-5">
        <div className="flex items-center">
          <Image src="/20221113_11223317.png" alt="KnowledgeDuck logo" width={300} height={64} className="h-auto w-[220px] sm:w-[280px]" priority />
        </div>
        <nav className="mt-3 border-t border-gray-100 pt-2 md:hidden">
          <ul className="grid grid-cols-3 gap-2 text-sm">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-blue-100 bg-blue-50 px-2 py-2 font-semibold text-blue-700 transition hover:bg-blue-100">
                  <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                  <span className="truncate text-xs sm:text-sm">{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
