'use client';
// Changing sort order preserves all current filter + page params.

import { useRouter, useSearchParams, usePathname } from 'next/navigation';

interface Props {
  currentSort: string;
}

export default function JobsSortSelect({ currentSort }: Props) {
  const router       = useRouter();
  const pathname     = usePathname();
  const searchParams = useSearchParams();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams.toString());
    const value  = e.target.value;
    if (value === 'newest') {
      params.delete('sort'); // 'newest' is default, keep URL clean
    } else {
      params.set('sort', value);
    }
    params.delete('page'); // reset to page 1 on sort change
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <select
      value={currentSort}
      onChange={handleChange}
      className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm bg-white focus:outline-none focus:border-blue-400 text-gray-700 font-medium cursor-pointer"
    >
      <option value="newest">Newest</option>
      <option value="last_date">Last Date</option>
      <option value="vacancies">Most Vacancies</option>
    </select>
  );
}