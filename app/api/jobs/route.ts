// GET /api/jobs?state=AP&page=1&limit=10&category=SSC+Jobs&search=railway&days=7&qual=Graduate&sort=newest

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Qualification → keywords to match against job title/category

const CATEGORY_FILTER_MAP: Record<string, string[]> = {
  'SSC Jobs': ['SSC Jobs', 'Civil Services'],
  'Bank Jobs': ['Bank Jobs', 'Banking'],
  'Railway Jobs': ['Railway Jobs', 'Railway'],
  'PSC Jobs': ['PSC Jobs', 'Civil Services'],
  'Police/Defense Jobs': ['Police/Defense Jobs', 'Police', 'Defence'],
  'Teachers Jobs': ['Teachers Jobs', 'Teaching'],
  'Engineering Jobs': ['Engineering Jobs', 'Engineering'],
  'Medical Jobs': ['Medical Jobs', 'Medical'],
  'PSU Jobs': ['PSU Jobs', 'PSU'],
  'Clerk Jobs': ['Clerk Jobs', 'Clerk'],
};

const QUAL_KEYWORDS: Record<string, string[]> = {
  '10th Pass':    ['10th', 'matriculation', 'sslc', 'matric'],
  '12th Pass':    ['12th', 'intermediate', 'hsc', 'higher secondary'],
  'Graduate':     ['graduate', 'degree', 'ba ', 'bsc', 'bcom', 'btech', 'be '],
  'Post Graduate':['post graduate', 'msc', 'ma ', 'mtech', 'mba', 'phd'],
  'ITI':          ['iti', 'industrial training'],
  'Diploma':      ['diploma'],
};

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  const state    = searchParams.get('state')?.toUpperCase() ?? '';
  const page     = Math.max(1, parseInt(searchParams.get('page')  ?? '1',  10));
  const limit    = Math.min(50, parseInt(searchParams.get('limit') ?? '10', 10));
  const category = searchParams.get('category') ?? '';
  const search   = searchParams.get('search')   ?? '';
  const qual     = searchParams.get('qual')      ?? '';
  const days     = parseInt(searchParams.get('days') ?? '0', 10);
  const sort     = searchParams.get('sort')      ?? 'newest';

  const from = (page - 1) * limit;
  const to   = from + limit - 1;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  let query = supabase
    .from('jobs')
    .select('*', { count: 'exact' })
    .eq('is_active', true)
    .range(from, to);

  // ── State filter ──────────────────────────────────────────────
  if (state && state !== 'ALL') {
    query = query.eq('state', state);
  } else {
    // Default: only AP + TS + Central (never OTHER)
    query = query.in('state', ['AP', 'TS', 'CENTRAL']);
  }

  // ── Category filter ───────────────────────────────────────────
  if (category) {
    const categoryValues = CATEGORY_FILTER_MAP[category] ?? [category];
    if (categoryValues.length === 1) {
      query = query.eq('category', categoryValues[0]);
    } else {
      query = query.in('category', categoryValues);
    }
  }

  // ── Text search (title + organization) ───────────────────────
  if (search) {
    query = query.or(`title.ilike.%${search}%,organization.ilike.%${search}%`);
  }

  // ── Qualification filter (keyword match on title) ─────────────
  if (qual && QUAL_KEYWORDS[qual]) {
    const keywords = QUAL_KEYWORDS[qual];
    const orClauses = keywords.map((kw) => `title.ilike.%${kw}%`).join(',');
    query = query.or(orClauses);
  }

  // ── Date range filter ─────────────────────────────────────────
  if (days > 0) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    query = query.gte('created_at', cutoff.toISOString());
  }

  // ── Sort ──────────────────────────────────────────────────────
  switch (sort) {
    case 'last_date':
      query = query.order('last_date', { ascending: true, nullsFirst: false });
      break;
    case 'vacancies':
      query = query.order('vacancies', { ascending: false, nullsFirst: false });
      break;
    default: // newest
      query = query.order('created_at', { ascending: false });
  }

  const { data, error, count } = await query;

  if (error) {
    console.error('[api/jobs] error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    jobs:       data ?? [],
    total:      count ?? 0,
    page,
    limit,
    totalPages: Math.ceil((count ?? 0) / limit),
  }, {
    headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=120' },
  });
}