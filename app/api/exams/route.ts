// GET /api/exams?state=ALL&limit=10

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const state = searchParams.get('state')?.toUpperCase() ?? 'ALL';
  const limit = Math.min(50, parseInt(searchParams.get('limit') ?? '10', 10));

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  let query = supabase
    .from('v_upcoming_exams')
    .select('*')
    .limit(limit);

  if (state !== 'ALL') {
    query = query.eq('state', state);
  } else {
    query = query.in('state', ['AP', 'TS', 'CENTRAL']);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ exams: data ?? [] }, {
    headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate=600' },
  });
}