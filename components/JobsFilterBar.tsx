'use client';
// Every onChange/submit calls updateParam() which:
//   1. Copies ALL current URL params into a new URLSearchParams
//   2. Sets/deletes only the changed key
//   3. Resets page to 1 (so you never land on page 5 of a fresh filter)
//   4. Calls router.push() with the merged params
//
// This guarantees that changing category keeps state/search etc, and vice versa.

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useCallback, useRef } from 'react';

const CATEGORIES = [
  'SSC Jobs', 'Bank Jobs', 'Railway Jobs', 'PSC Jobs',
  'Police/Defense Jobs', 'Teachers Jobs', 'Engineering Jobs',
  'Medical Jobs', 'PSU Jobs',
];

const STATES = [
  { value: 'AP',      label: 'Andhra Pradesh' },
  { value: 'TS',      label: 'Telangana' },
  { value: 'CENTRAL', label: 'Central Government' },
];

const QUALIFICATIONS = ['10th Pass', '12th Pass', 'Graduate', 'Post Graduate', 'ITI', 'Diploma'];

const DATE_RANGES = [
  { value: '7',  label: 'Last 7 Days' },
  { value: '30', label: 'Last 30 Days' },
  { value: '90', label: 'Last 3 Months' },
];

export default function JobsFilterBar() {
  const router       = useRouter();
  const pathname     = usePathname();
  const searchParams = useSearchParams();
  const searchRef    = useRef<HTMLInputElement>(null);

  // Core helper: merge one key into current params, reset page
  const updateParam = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete('page'); // always reset page on filter change
    router.push(`${pathname}?${params.toString()}`);
  }, [router, pathname, searchParams]);

  const clearAll = () => router.push(pathname);

  const current = {
    category: searchParams.get('category') ?? '',
    state:    searchParams.get('state')    ?? '',
    qual:     searchParams.get('qual')     ?? '',
    days:     searchParams.get('days')     ?? '',
    search:   searchParams.get('search')   ?? '',
  };

  const hasFilters = Object.values(current).some(Boolean);

  const handleSearch = () => {
    updateParam('search', searchRef.current?.value.trim() ?? '');
  };

  return (
    <div className="bg-white rounded-2xl shadow p-4 mb-4 space-y-3">

      {/* ── Dropdowns + search + button ── */}
      <div className="flex flex-wrap gap-3 items-center">

        <SelectBox
          value={current.category}
          onChange={(v) => updateParam('category', v)}
          placeholder="All Categories"
          options={CATEGORIES.map((c) => ({ value: c, label: c }))}
        />

        <SelectBox
          value={current.state}
          onChange={(v) => updateParam('state', v)}
          placeholder="Anywhere in India"
          options={STATES}
        />

        <SelectBox
          value={current.qual}
          onChange={(v) => updateParam('qual', v)}
          placeholder="Any Qualification"
          options={QUALIFICATIONS.map((q) => ({ value: q, label: q }))}
        />

        <SelectBox
          value={current.days}
          onChange={(v) => updateParam('days', v)}
          placeholder="All Posted Dates"
          options={DATE_RANGES}
        />

        {/* Search input */}
        <div className="relative flex-1 min-w-[160px]">
          <input
            ref={searchRef}
            type="text"
            placeholder="Search jobs…"
            defaultValue={current.search}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400 text-gray-700"
          />
        </div>

        <button
          onClick={handleSearch}
          className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-7 py-2.5 rounded-xl text-sm transition-colors whitespace-nowrap"
        >
          Search
        </button>
      </div>

      {/* ── Active filter chips ── */}
      {hasFilters && (
        <div className="flex flex-wrap gap-2 items-center pt-0.5">
          <span className="text-xs text-gray-400 font-medium">Active:</span>

          {current.category && (
            <Chip label={current.category} onRemove={() => updateParam('category', '')} />
          )}
          {current.state && (
            <Chip
              label={STATES.find((s) => s.value === current.state)?.label ?? current.state}
              onRemove={() => updateParam('state', '')}
            />
          )}
          {current.qual && (
            <Chip label={current.qual} onRemove={() => updateParam('qual', '')} />
          )}
          {current.days && (
            <Chip
              label={DATE_RANGES.find((d) => d.value === current.days)?.label ?? `${current.days}d`}
              onRemove={() => updateParam('days', '')}
            />
          )}
          {current.search && (
            <Chip label={`"${current.search}"`} onRemove={() => updateParam('search', '')} />
          )}

          <button
            onClick={clearAll}
            className="text-xs text-red-400 hover:text-red-600 font-semibold underline ml-1"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}

// ── SelectBox ─────────────────────────────────────────────────────
function SelectBox({
  value,
  onChange,
  placeholder,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none border border-gray-200 rounded-xl px-4 py-2.5 pr-8 text-sm bg-white focus:outline-none focus:border-blue-400 font-medium text-gray-700 cursor-pointer"
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <svg
        className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none"
        fill="none" stroke="currentColor" viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  );
}

// ── Filter chip ───────────────────────────────────────────────────
function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-blue-200">
      {label}
      <button
        onClick={onRemove}
        className="hover:text-red-500 font-bold leading-none ml-0.5"
        aria-label={`Remove ${label}`}
      >
        ×
      </button>
    </span>
  );
}