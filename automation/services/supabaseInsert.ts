import { createClient } from '@supabase/supabase-js';
import type { NormalizedJob, NormalizedExam } from '../types';

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env');
  return createClient(url, key, { auth: { persistSession: false } });
}

// ── Dedup array by source_id (safety net before hitting Supabase) ──
function dedupBySourceId<T extends { source_id: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.source_id)) return false;
    seen.add(item.source_id);
    return true;
  });
}

// ── Upsert jobs in chunks of 50 ───────────────────────────────────
export async function upsertJobs(jobs: NormalizedJob[]): Promise<number> {
  if (jobs.length === 0) return 0;

  const supabase = getSupabaseAdmin();
  // Always deduplicate before sending — prevents "ON CONFLICT affects row twice"
  const unique = dedupBySourceId(jobs);
  let saved = 0;

  const CHUNK = 50;
  for (let i = 0; i < unique.length; i += CHUNK) {
    const chunk = unique.slice(i, i + CHUNK);
    const { error, count } = await supabase
      .from('jobs')
      .upsert(chunk, { onConflict: 'source_id', count: 'exact' });

    if (error) {
      console.error('[supabase] upsertJobs error:', error.message);
      // Log the offending source_ids to help debug
      console.error('[supabase] Chunk source_ids:', chunk.map((j) => j.source_id).join(', '));
    } else {
      saved += count ?? chunk.length;
    }
  }

  return saved;
}

// ── Upsert exams in chunks of 50 ─────────────────────────────────
export async function upsertExams(exams: NormalizedExam[]): Promise<number> {
  if (exams.length === 0) return 0;

  const supabase = getSupabaseAdmin();
  const unique = dedupBySourceId(exams);
  let saved = 0;

  const CHUNK = 50;
  for (let i = 0; i < unique.length; i += CHUNK) {
    const chunk = unique.slice(i, i + CHUNK);
    const { error, count } = await supabase
      .from('exams')
      .upsert(chunk, { onConflict: 'source_id', count: 'exact' });

    if (error) {
      console.error('[supabase] upsertExams error:', error.message);
    } else {
      saved += count ?? chunk.length;
    }
  }

  return saved;
}

// ── Mark stale jobs inactive ──────────────────────────────────────
export async function markStaleJobsInactive(days = 90): Promise<void> {
  const supabase = getSupabaseAdmin();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  const { error } = await supabase
    .from('jobs')
    .update({ is_active: false })
    .lt('created_at', cutoff.toISOString())
    .eq('is_active', true);

  if (error) console.error('[supabase] markStaleJobsInactive error:', error.message);
}