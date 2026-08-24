"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setError("");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setError(error.message); setLoading(false); return; }
    router.push("/dashboard"); router.refresh();
  }

  return <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6"><div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm">
    <div className="mb-8"><p className="text-sm font-medium text-blue-600">Queueless</p><h1 className="mt-2 text-3xl font-bold text-slate-900">Welcome back</h1><p className="mt-2 text-slate-500">Sign in to manage your campus services.</p></div>
    <form onSubmit={handleLogin} className="space-y-5">
      <div><label className="mb-2 block text-sm font-medium">College Email</label><input type="email" required value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="you@college.edu" className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500" /></div>
      <div><label className="mb-2 block text-sm font-medium">Password</label><input type="password" required value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="••••••••" className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500" /></div>
      {error && <div className="rounded-xl bg-red-50 p-3 text-sm text-red-600">{error}</div>}
      <button type="submit" disabled={loading} className="w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50">{loading ? "Signing in..." : "Sign in"}</button>
    </form>
    <div className="mt-6 border-t pt-6 text-center text-sm text-slate-500">Don&apos;t have a student account? <Link href="/signup" className="font-semibold text-blue-600 hover:text-blue-700">Sign up</Link></div>
  </div></main>;
}
