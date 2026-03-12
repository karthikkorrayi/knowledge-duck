// GET /api/jobs/categories
// Returns per-category job counts for the sidebar

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const CATEGORY_LABELS: Record<string, string> = {
  'Civil Services': 'PSC Jobs',
  'Banking':        'Bank Jobs',
  'Railway':        'Railway Jobs',
  'Police':         'Police/Defense Jobs',
  'Defence':        'Police/Defense Jobs',
  'Teaching':       'Teachers Jobs',
  'Engineering':    'Engineering Jobs',
  'Clerk':          'Clerk Jobs',
  'PSU':            'PSU Jobs',
  'Medical':        'Medical Jobs',
};

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const { data, error } = await supabase
    .from('jobs')
    .select('category')
    .eq('is_active', true)
    .in('state', ['AP', 'TS', 'CENTRAL'])
    .not('category', 'is', null);

  if (error) {
    return NextResponse.json([], { status: 500 });
  }

  // Count per mapped label
  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    const label = CATEGORY_LABELS[row.category] ?? row.category;
    counts[label] = (counts[label] ?? 0) + 1;
  }

  // Sort by count desc, return top 6
  const result = Object.entries(counts)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  return NextResponse.json(result, {
    headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate=600' },
  });
}