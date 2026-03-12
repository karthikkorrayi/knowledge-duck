export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
export const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export type JobRecord = {
  id: string;
  title: string;
  location: string;
  qualification?: string;
  department?: string;
  last_date: string;
  posted_date?: string;
  status?: string;
};

export type ExamRecord = {
  id: string;
  name: string;
  exam_date: string;
  status: string;
};

function supabaseHeaders() {
  const token = SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;

  return {
    apikey: token,
    Authorization: `Bearer ${token}`,
  };
}

async function parseArrayResponse<T>(res: Response, context: string): Promise<T[]> {
  const bodyText = await res.text();
  let data: unknown = null;

  if (bodyText) {
    try {
      data = JSON.parse(bodyText);
    } catch {
      if (process.env.NODE_ENV !== "production") {
        console.warn(`Failed to parse Supabase response for ${context}`);
      }
      return [];
    }
  }

  if (!res.ok) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`Supabase request failed for ${context} (${res.status})`);
    }
    return [];
  }

  if (!Array.isArray(data)) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`Unexpected Supabase response shape for ${context}`);
    }
    return [];
  }

  return data as T[];
}

export async function fetchJobs(): Promise<JobRecord[]> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/jobs?select=*&order=posted_date.desc&limit=6`,
    {
      headers: supabaseHeaders(),
      cache: "no-store",
    }
  );

  return parseArrayResponse<JobRecord>(res, "fetchJobs");
}

export async function fetchAllJobs(): Promise<JobRecord[]> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/jobs?select=*&order=posted_date.desc`,
    {
      headers: supabaseHeaders(),
      cache: "no-store",
    }
  );

  return parseArrayResponse<JobRecord>(res, "fetchAllJobs");
}

export async function fetchJobStats() {
  const jobRes = await fetch(
    `${SUPABASE_URL}/rest/v1/jobs?select=status`,
    {
      headers: supabaseHeaders(),
      cache: "no-store",
    }
  );

  const jobs = await parseArrayResponse<{ status?: string }>(jobRes, "fetchJobStats");

  const total = jobs.length;
  const active = jobs.filter((job) => job.status === "Active").length;

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
      headers: supabaseHeaders(),
      cache: "no-store",
    }
  );

  const exams = await parseArrayResponse<{ id: string }>(res, "fetchUpcomingExamCount");

  return exams.length;
}

export async function fetchUpcomingExams(): Promise<ExamRecord[]> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/exams?status=eq.Upcoming&select=*&order=exam_date.asc&limit=5`,
    {
      headers: supabaseHeaders(),
      cache: "no-store",
    }
  );

  return parseArrayResponse<ExamRecord>(res, "fetchUpcomingExams");
}