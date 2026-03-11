import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function insertJobs(jobs: any[]) {
  for (const job of jobs) {

    const { data: existing } = await supabase
      .from("jobs")
      .select("id")
      .eq("apply_link", job.apply_link)
      .single()

    if (existing) continue

    await supabase.from("jobs").insert(job)
  }
}