"use client";

import Link from "next/link";
import { useState } from "react";

type JobForm = {
  title: string;
  location: string;
  qualification: string;
  last_date: string;
  posted_date: string;
  status: string;
};

const initialForm: JobForm = {
  title: "Railway Apprentice",
  location: "India",
  qualification: "10th / ITI",
  last_date: "2024-06-01",
  posted_date: "2026-02-08",
  status: "",
};

export default function AdminPage() {
  const [form, setForm] = useState<JobForm>(initialForm);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string>("");
  const [error, setError] = useState<string>("");

  function updateField<K extends keyof JobForm>(key: K, value: JobForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/admin/seed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.details || data?.error || "Failed to create job record");
      }

      setSuccess("Job inserted successfully into Supabase.");
      setForm((prev) => ({ ...prev, title: "", location: "", qualification: "" }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 to-blue-100 px-4 py-8">
      <div className="mx-auto max-w-3xl rounded-2xl border border-blue-100 bg-white p-6 shadow-lg sm:p-8">
        <div className="mb-5 flex items-center justify-between gap-3">
          <h1 className="text-2xl font-black text-blue-900 sm:text-3xl">Admin Portal</h1>
          <Link href="/" className="rounded-lg bg-blue-100 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-200">
            Back to Dashboard
          </Link>
        </div>

        <p className="mb-6 text-sm text-gray-600">
          Create real job records using your Supabase columns: <strong>title, location, qualification, last_date, posted_date, status</strong>.
          This admin action inserts only into <strong>jobs</strong> and expects server env <strong>SUPABASE_SERVICE_ROLE_KEY</strong>.
        </p>

        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Title" value={form.title} onChange={(value) => updateField("title", value)} placeholder="SSC CGL 2024" required />
            <Field label="Location" value={form.location} onChange={(value) => updateField("location", value)} placeholder="All India" required />
            <Field label="Qualification" value={form.qualification} onChange={(value) => updateField("qualification", value)} placeholder="Any Degree" required />
            <Field label="Status" value={form.status} onChange={(value) => updateField("status", value)} placeholder="Active (optional)" />
            <Field label="Last Date" value={form.last_date} onChange={(value) => updateField("last_date", value)} placeholder="YYYY-MM-DD" required />
            <Field label="Posted Date" value={form.posted_date} onChange={(value) => updateField("posted_date", value)} placeholder="YYYY-MM-DD" required />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-5 py-3 text-sm font-bold text-white shadow hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Saving to Supabase..." : "Create Job Record"}
          </button>
        </form>

        {error ? <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
        {success ? <div className="mt-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{success}</div> : null}
      </div>
    </div>
  );
}

type FieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  required?: boolean;
};

function Field({ label, value, onChange, placeholder, required }: FieldProps) {
  return (
    <label className="block text-sm font-semibold text-gray-700">
      <span className="mb-1 block">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none ring-blue-300 focus:ring"
      />
    </label>
  );
}