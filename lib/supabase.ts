export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
export const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
export async function fetchJobs() {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/jobs?select=*&order=posted_date.desc&limit=6`,
    {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      cache: "no-store",
    }
  );

  return res.json();
}

export async function fetchAllJobs() {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/jobs?select=*&order=posted_date.desc`,
    {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      cache: "no-store",
    }
  );

  return res.json();
}

export async function fetchJobStats() {
  const jobRes = await fetch(
    `${SUPABASE_URL}/rest/v1/jobs?select=status`,
    {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      cache: "no-store",
    }
  );

  const jobs = await jobRes.json();

  const total = jobs.length;
  const active = jobs.filter((job: any) => job.status === "Active").length;

  const upcomingExams = await fetchUpcomingExamCount();

  return {
    total,
    active,
    upcomingExams,
  };
}

export async function fetchUpcomingExamCount() {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/exams?status=eq.Upcoming&select=id`,
    {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      cache: "no-store",
    }
  );

  const exams = await res.json();

  return exams.length;
}

export async function fetchUpcomingExams() {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/exams?status=eq.Upcoming&select=*&order=exam_date.asc&limit=5`,
    {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      cache: "no-store",
    }
  );

  return res.json();
}