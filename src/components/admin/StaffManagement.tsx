"use client";

import { FormEvent, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface StaffMember {
  id: string;
  name: string | null;
  student_id: string | null;
  role: string;
  created_at: string;
}

export default function StaffManagement() {
  const supabase = createClient();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    name: "",
    staff_id: "",
    email: "",
    password: "",
  });

  async function loadStaff() {
    setLoading(true);
    setError("");

    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;

    if (!accessToken) {
      setError("Your session has expired. Please sign in again.");
      setLoading(false);
      return;
    }

    const { data, error: functionError } = await supabase.functions.invoke(
      "admin-staff",
      {
        body: { action: "list" },
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (functionError) {
      setError(functionError.message);
    } else if (data?.error) {
      setError(data.error);
    } else {
      setStaff((data?.staff ?? []) as StaffMember[]);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadStaff();
  }, []);

  async function createStaff(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;

    if (!accessToken) {
      setError("Your session has expired. Please sign in again.");
      setSaving(false);
      return;
    }

    const { data, error: functionError } = await supabase.functions.invoke(
      "admin-staff",
      {
        body: {
          action: "create",
          name: form.name,
          staff_id: form.staff_id,
          email: form.email,
          password: form.password,
        },
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (functionError) {
      setError(functionError.message);
      setSaving(false);
      return;
    }

    if (data?.error) {
      setError(data.error);
      setSaving(false);
      return;
    }

    setMessage("Staff account created successfully.");
    setForm({ name: "", staff_id: "", email: "", password: "" });
    setSaving(false);
    await loadStaff();
  }

  return (
    <section className="mt-10">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold">Staff Management</h3>
          <p className="mt-1 text-sm text-slate-500">
            Create and manage staff accounts for campus counters.
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <form onSubmit={createStaff} className="rounded-2xl border bg-white p-6 shadow-sm">
          <h4 className="font-semibold">Add Staff Member</h4>

          <div className="mt-5 space-y-4">
            <Field
              label="Full Name"
              value={form.name}
              onChange={(value) => setForm((current) => ({ ...current, name: value }))}
              placeholder="Rahul Kumar"
              required
            />
            <Field
              label="Staff ID"
              value={form.staff_id}
              onChange={(value) => setForm((current) => ({ ...current, staff_id: value }))}
              placeholder="STAFF-001"
              required
            />
            <Field
              label="Email"
              type="email"
              value={form.email}
              onChange={(value) => setForm((current) => ({ ...current, email: value }))}
              placeholder="rahul@college.edu"
              required
            />
            <Field
              label="Temporary Password"
              type="password"
              value={form.password}
              onChange={(value) => setForm((current) => ({ ...current, password: value }))}
              placeholder="At least 8 characters"
              minLength={8}
              required
            />
          </div>

          {error && (
            <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-600">{error}</p>
          )}
          {message && (
            <p className="mt-4 rounded-xl bg-green-50 p-3 text-sm text-green-700">{message}</p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="mt-5 w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Creating..." : "Create Staff"}
          </button>
        </form>

        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold">Current Staff</h4>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              {staff.length} {staff.length === 1 ? "member" : "members"}
            </span>
          </div>

          {loading ? (
            <p className="mt-6 text-sm text-slate-500">Loading staff...</p>
          ) : staff.length === 0 ? (
            <div className="mt-6 rounded-xl bg-slate-50 p-5 text-sm text-slate-500">
              No staff accounts have been created yet.
            </div>
          ) : (
            <div className="mt-4 divide-y">
              {staff.map((member) => (
                <div key={member.id} className="flex items-center justify-between gap-4 py-4">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{member.name || "Unnamed staff"}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {member.student_id || "No staff ID"}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                    {member.role}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
  minLength,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
  required?: boolean;
  minLength?: number;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        minLength={minLength}
        className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      />
    </label>
  );
}
