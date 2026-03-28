'use client';
import { useState } from 'react';

export type Tab = 'details' | 'eligibility' | 'application' | 'dates';

const TABS: { key: Tab; label: string }[] = [
  { key: 'details',     label: 'Job Details' },
  { key: 'eligibility', label: 'Eligibility' },
  { key: 'application', label: 'Application Process' },
  { key: 'dates',       label: 'Important Dates' },
];

interface Props {
  panels: Record<Tab, React.ReactNode>;
}

export default function JobDetailTabs({ panels }: Props) {
  const [active, setActive] = useState<Tab>('details');

  return (
    <div>
      {/* Mobile: linear sections instead of tab navigation */}
      <div className="space-y-6 p-5 md:hidden">
        {TABS.map((tab) => (
          <section key={tab.key}>
            <h3 className="mb-3 text-lg font-bold text-gray-800">{tab.label}</h3>
            {panels[tab.key]}
          </section>
        ))}
      </div>

      {/* Tab bar */}
      <div className="hidden overflow-x-auto border-b border-gray-200 bg-white md:flex">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActive(tab.key)}
            className={`px-5 py-3.5 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
              active === tab.key
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Active panel */}
      <div className="hidden p-5 md:block">
        {panels[active]}
      </div>
    </div>
  );
}