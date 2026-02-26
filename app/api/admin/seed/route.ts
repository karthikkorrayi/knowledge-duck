import { NextResponse } from "next/server";
import { SUPABASE_URL } from "@/lib/supabase";

type CreateJobRequest = {
  title?: string;
  location?: string;
  qualification?: string;
  last_date?: string;
  posted_date?: string;
  status?: string;
};

function isValidDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function getAdminApiKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as CreateJobRequest;

    const title = body.title?.trim() ?? "";
    const location = body.location?.trim() ?? "";
    const qualification = body.qualification?.trim() ?? "";
    const lastDate = body.last_date?.trim() ?? "";
    const postedDate = body.posted_date?.trim() ?? "";
    const status = body.status?.trim() ?? "";

    if (!title || !location || !qualification || !lastDate || !postedDate) {
      return NextResponse.json(
        { error: "Please provide title, location, qualification, last_date, and posted_date." },
        { status: 400 }
      );
    }

    if (!isValidDate(lastDate) || !isValidDate(postedDate)) {
      return NextResponse.json(
        { error: "Use YYYY-MM-DD format for last_date and posted_date." },
        { status: 400 }
      );
    }

    const adminApiKey = getAdminApiKey();
    if (!adminApiKey) {
      return NextResponse.json(
        {
          error: "Missing SUPABASE_SERVICE_ROLE_KEY for admin inserts.",
          details: "Set SUPABASE_SERVICE_ROLE_KEY in your server environment to bypass RLS for admin create operations.",
        },
        { status: 500 }
      );
    }

    const payload = {
      title,
      location,
      qualification,
      last_date: lastDate,
      posted_date: postedDate,
      status,
    };

    // This endpoint writes only one table: INSERT into public.jobs.
    const response = await fetch(`${SUPABASE_URL}/rest/v1/jobs`, {
      method: "POST",
      headers: {
        apikey: adminApiKey,
        Authorization: `Bearer ${adminApiKey}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify([payload]),
      cache: "no-store",
    });

    if (!response.ok) {
      const details = await response.text();
      return NextResponse.json({ error: "Supabase insert failed", details }, { status: 500 });
    }

    const inserted = await response.json();
    return NextResponse.json({ inserted: inserted[0] ?? null });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Unexpected server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}