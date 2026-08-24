"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Counter { id: string; name: string; location: string | null; status: string }
interface Service { id: string; name: string; description: string | null; average_service_time: number; grace_period: number; is_active: boolean }
interface Staff { id: string; name: string | null; student_id: string | null }

export default function CampusManagement() {
  const supabase = createClient();
  const [counters, setCounters] = useState<Counter[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [counterForm, setCounterForm] = useState({ name: "", location: "" });
  const [serviceForm, setServiceForm] = useState({ name: "", description: "", average: "5", grace: "5" });
  const [assignments, setAssignments] = useState<Record<string,string>>({});
  const [busy, setBusy] = useState(false);

  async function load() {
    const [c, s, p] = await Promise.all([
      supabase.from("counters").select("id,name,location,status").order("created_at"),
      supabase.from("services").select("id,name,description,average_service_time,grace_period,is_active").order("created_at"),
      supabase.from("profiles").select("id,name,student_id").eq("role", "STAFF").order("created_at", { ascending: false }),
    ]);
    if (c.error || s.error || p.error) setError(c.error?.message || s.error?.message || p.error?.message || "Could not load management data");
    setCounters((c.data ?? []) as Counter[]);
    setServices((s.data ?? []) as Service[]);
    setStaff((p.data ?? []) as Staff[]);
  }

  useEffect(() => { load(); }, []);

  async function saveCounter() {
    if (!counterForm.name.trim()) return;
    setBusy(true); setError(""); setMessage("");
    const { error } = await supabase.rpc("admin_upsert_counter", { p_id: null, p_name: counterForm.name, p_location: counterForm.location, p_status: "CLOSED" });
    if (error) setError(error.message); else { setMessage("Counter created."); setCounterForm({ name: "", location: "" }); await load(); }
    setBusy(false);
  }

  async function saveService() {
    if (!serviceForm.name.trim()) return;
    setBusy(true); setError(""); setMessage("");
    const { error } = await supabase.rpc("admin_upsert_service", {
      p_id: null,
      p_name: serviceForm.name,
      p_description: serviceForm.description,
      p_average_service_time: Number(serviceForm.average),
      p_grace_period: Number(serviceForm.grace),
      p_is_active: true,
    });
    if (error) setError(error.message); else { setMessage("Service created."); setServiceForm({ name: "", description: "", average: "5", grace: "5" }); await load(); }
    setBusy(false);
  }

  async function assign(staffId: string) {
    const counterId = assignments[staffId];
    if (!counterId) return;
    setBusy(true); setError(""); setMessage("");
    const { error } = await supabase.rpc("admin_assign_staff", { p_staff_id: staffId, p_counter_id: counterId });
    if (error) setError(error.message); else setMessage("Staff assignment updated.");
    setBusy(false);
  }

  async function toggleService(service: Service) {
    setBusy(true); setError("");
    const { error } = await supabase.rpc("admin_upsert_service", {
      p_id: service.id, p_name: service.name, p_description: service.description ?? "",
      p_average_service_time: service.average_service_time, p_grace_period: service.grace_period, p_is_active: !service.is_active,
    });
    if (error) setError(error.message); else await load();
    setBusy(false);
  }

  async function toggleCounter(counter: Counter) {
    const next = counter.status === "OPEN" ? "CLOSED" : "OPEN";
    setBusy(true); setError("");
    const { error } = await supabase.rpc("admin_upsert_counter", { p_id: counter.id, p_name: counter.name, p_location: counter.location ?? "", p_status: next });
    if (error) setError(error.message); else await load();
    setBusy(false);
  }

  return (
    <section className="mt-10 grid gap-6 lg:grid-cols-2">
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <h3 className="text-xl font-bold">Counter Management</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <input className="rounded-xl border px-3 py-2.5" placeholder="Counter name" value={counterForm.name} onChange={e=>setCounterForm({...counterForm,name:e.target.value})}/>
          <input className="rounded-xl border px-3 py-2.5" placeholder="Location" value={counterForm.location} onChange={e=>setCounterForm({...counterForm,location:e.target.value})}/>
        </div>
        <button disabled={busy} onClick={saveCounter} className="mt-3 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">Add Counter</button>
        <div className="mt-5 space-y-3">
          {counters.map(c=><div key={c.id} className="flex items-center justify-between rounded-xl bg-slate-50 p-4">
            <div><p className="font-semibold">{c.name}</p><p className="text-xs text-slate-500">{c.location || "No location"}</p></div>
            <button disabled={busy} onClick={()=>toggleCounter(c)} className="rounded-full bg-white px-3 py-1 text-xs font-semibold shadow-sm">{c.status}</button>
          </div>)}
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <h3 className="text-xl font-bold">Service Management</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <input className="rounded-xl border px-3 py-2.5" placeholder="Service name" value={serviceForm.name} onChange={e=>setServiceForm({...serviceForm,name:e.target.value})}/>
          <input className="rounded-xl border px-3 py-2.5" placeholder="Description" value={serviceForm.description} onChange={e=>setServiceForm({...serviceForm,description:e.target.value})}/>
          <input type="number" min="1" className="rounded-xl border px-3 py-2.5" placeholder="Avg minutes" value={serviceForm.average} onChange={e=>setServiceForm({...serviceForm,average:e.target.value})}/>
          <input type="number" min="0" className="rounded-xl border px-3 py-2.5" placeholder="Grace minutes" value={serviceForm.grace} onChange={e=>setServiceForm({...serviceForm,grace:e.target.value})}/>
        </div>
        <button disabled={busy} onClick={saveService} className="mt-3 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">Add Service</button>
        <div className="mt-5 space-y-3">
          {services.map(s=><div key={s.id} className="flex items-center justify-between rounded-xl bg-slate-50 p-4">
            <div><p className="font-semibold">{s.name}</p><p className="text-xs text-slate-500">~{s.average_service_time} min · grace {s.grace_period} min</p></div>
            <button disabled={busy} onClick={()=>toggleService(s)} className={`rounded-full px-3 py-1 text-xs font-semibold ${s.is_active ? "bg-green-50 text-green-700" : "bg-slate-200 text-slate-500"}`}>{s.is_active ? "ACTIVE" : "INACTIVE"}</button>
          </div>)}
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-6 shadow-sm lg:col-span-2">
        <h3 className="text-xl font-bold">Staff → Counter Assignment</h3>
        <p className="mt-1 text-sm text-slate-500">Assign a staff member to the counter they operate.</p>
        <div className="mt-5 space-y-3">
          {staff.length === 0 && <p className="text-sm text-slate-400">No staff accounts yet.</p>}
          {staff.map(member=><div key={member.id} className="flex flex-col gap-3 rounded-xl bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div><p className="font-semibold">{member.name || "Unnamed"}</p><p className="text-xs text-slate-500">{member.student_id}</p></div>
            <div className="flex gap-2"><select className="rounded-xl border bg-white px-3 py-2 text-sm" value={assignments[member.id] || ""} onChange={e=>setAssignments({...assignments,[member.id]:e.target.value})}><option value="">Choose counter</option>{counters.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select><button disabled={busy || !assignments[member.id]} onClick={()=>assign(member.id)} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40">Assign</button></div>
          </div>)}
        </div>
      </div>

      {(message || error) && <div className={`lg:col-span-2 rounded-xl p-4 text-sm ${error ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>{error || message}</div>}
    </section>
  );
}
