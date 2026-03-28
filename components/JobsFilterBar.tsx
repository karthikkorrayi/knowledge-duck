'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

const CATEGORIES = [
  'SSC Jobs', 'Bank Jobs', 'Railway Jobs', 'PSC Jobs',
  'Police/Defense Jobs', 'Teachers Jobs', 'Engineering Jobs',
  'Medical Jobs', 'PSU Jobs',
];

const STATES = [
  { value: 'AP', label: 'Andhra Pradesh' },
  { value: 'TS', label: 'Telangana' },
  { value: 'CENTRAL', label: 'Central Government' },
];

const QUALIFICATIONS = ['10th Pass', '12th Pass', 'Graduate', 'Post Graduate', 'ITI', 'Diploma'];

const DATE_RANGES = [
  { value: '7', label: 'Last 7 Days' },
  { value: '30', label: 'Last 30 Days' },
  { value: '90', label: 'Last 3 Months' },
];

type Draft = {
  category: string;
  state: string;
  qual: string;
  days: string;
  search: string;
};

export default function JobsFilterBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const current = useMemo<Draft>(() => ({
    category: searchParams.get('category') ?? '',
    state: searchParams.get('state') ?? '',
    qual: searchParams.get('qual') ?? '',
    days: searchParams.get('days') ?? '',
    search: searchParams.get('search') ?? '',
  }), [searchParams]);

  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(current);

  useEffect(() => {
    setDraft(current);
  }, [current]);

  const hasFilters = Object.values(current).some(Boolean);
  const activeCount = Object.values(current).filter(Boolean).length;

  const setSingleValue = (key: keyof Draft, value: string) => {
    setDraft((prev) => ({ ...prev, [key]: prev[key] === value ? '' : value }));
  };

  const applyFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    const entries = Object.entries(draft) as [keyof Draft, string][];

    entries.forEach(([key, value]) => {
      if (value.trim()) params.set(key, value.trim());
      else params.delete(key);
    });

    params.delete('page');
    router.push(params.toString() ? `${pathname}?${params.toString()}` : pathname);
    setIsOpen(false);
  };

  const clearAll = () => {
    setDraft({ category: '', state: '', qual: '', days: '', search: '' });
    router.push(pathname);
    setIsOpen(false);
  };

  return (
    <div className="mb-4 rounded-2xl bg-white p-4 shadow">
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => setIsOpen((prev) => !prev)}
          className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
          aria-expanded={isOpen}
          aria-controls="jobs-filters-panel"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707l-6.414 6.414A1 1 0 0014 13.828V19l-4 2v-7.172a1 1 0 00-.293-.707L3.293 6.707A1 1 0 013 6V4z" />
          </svg>
          Filters
          {activeCount > 0 && (
            <span className="rounded-full bg-blue-600 px-2 py-0.5 text-xs font-bold text-white">
              {activeCount}
            </span>
          )}
        </button>

        {hasFilters && (
          <button onClick={clearAll} className="text-sm font-semibold text-red-500 hover:text-red-600">
            Clear all
          </button>
        )}
      </div>

      {isOpen && (
        <div id="jobs-filters-panel" className="mt-4 space-y-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
          <FilterGroup
            title="Category"
            options={CATEGORIES.map((value) => ({ value, label: value }))}
            selected={draft.category}
            onChange={(value) => setSingleValue('category', value)}
          />

          <FilterGroup
            title="Location"
            options={STATES}
            selected={draft.state}
            onChange={(value) => setSingleValue('state', value)}
          />

          <FilterGroup
            title="Qualification"
            options={QUALIFICATIONS.map((value) => ({ value, label: value }))}
            selected={draft.qual}
            onChange={(value) => setSingleValue('qual', value)}
          />

          <FilterGroup
            title="Posted Date"
            options={DATE_RANGES}
            selected={draft.days}
            onChange={(value) => setSingleValue('days', value)}
          />

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">
              Search keyword
            </label>
            <input
              value={draft.search}
              onChange={(e) => setDraft((prev) => ({ ...prev, search: e.target.value }))}
              type="text"
              placeholder="Search jobs..."
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 focus:border-blue-400 focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <button
              onClick={applyFilters}
              className="inline-flex items-center rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-orange-600"
            >
              Apply Filters
            </button>
            <button
              onClick={clearAll}
              className="inline-flex items-center rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-100"
            >
              Reset
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function FilterGroup({
  title,
  options,
  selected,
  onChange,
}: {
  title: string;
  options: { value: string; label: string }[];
  selected: string;
  onChange: (value: string) => void;
}) {
  return (
    <fieldset>
      <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">{title}</legend>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {options.map((option) => {
          const checked = selected === option.value;
          return (
            <label
              key={option.value}
              className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
                checked
                  ? 'border-blue-300 bg-blue-50 text-blue-700'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-blue-200'
              }`}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => onChange(option.value)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span>{option.label}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}