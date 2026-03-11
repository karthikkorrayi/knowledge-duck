const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function saveJobs(jobs: any[]) {
  for (const job of jobs) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/jobs`, {
      method: "POST",
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates",
      },
      body: JSON.stringify(job),
    });

    if (res.ok) {
      console.log("Saved:", job.title);
    } else {
      console.log("Skipped:", job.title);
    }
  }
}