export const SUPABASE_URL = "https://zsqypecdfgkturkkjard.supabase.co";
export const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpzcXlwZWNkZmdrdHVya2tqYXJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1NTI5OTAsImV4cCI6MjA4NjEyODk5MH0.KbTS1XjzztGrvWLkrfJwbL9aDhyPgq8I0zP0uQM8rNw";
export const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpzcXlwZWNkZmdrdHVya2tqYXJkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDU1Mjk5MCwiZXhwIjoyMDg2MTI4OTkwfQ.xnDfJR_oCMAFywvAFlXERtDCUGEtPUsg3XJmiGeMtvA"
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