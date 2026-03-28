'use client';
import { useState } from 'react';

export type Tab = 'details' | 'eligibility' | 'application' | 'dates';

export interface TabItem {
  key: Tab;
  label: string;
  content: React.ReactNode;
}

interface Props {
  items: TabItem[];
}

export default function JobDetailTabs({ items }: Props) {
  const [active, setActive] = useState<Tab>(items[0]?.key ?? 'details');

  return (
    <div>
      {/* Mobile: linear sections instead of tab navigation */}
      <div className="space-y-6 p-5 md:hidden">
        {items.map((item) => (
          <section key={item.key}>
            <h3 className="mb-3 text-lg font-bold text-gray-800">{item.label}</h3>
            {item.content}
          </section>
        ))}
      </div>

      {/* Tab bar */}
      <div className="hidden overflow-x-auto border-b border-gray-200 bg-white md:flex">
        {items.map((item) => (
          <button
            key={item.key}
            onClick={() => setActive(item.key)}
            className={`px-5 py-3.5 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
              active === item.key
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Active panel */}
      <div className="hidden p-5 md:block">
        {items.find((item) => item.key === active)?.content}
      </div>
    </div>
  );
}