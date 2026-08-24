import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import StaffQueue from "@/components/staff/StaffQueue";
import LogoutButton from "@/components/auth/LogoutButton";

export default async function StaffDashboard(){
 const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)redirect("/login");
 const {data:profile}=await supabase.from("profiles").select("name,role").eq("id",user.id).single();if(!profile||!["STAFF","ADMIN"].includes(profile.role))redirect("/dashboard");
 let countersQuery=supabase.from("counters").select("*").order("name");
 if(profile.role==="STAFF"){
  const {data:assignment}=await supabase.from("staff_counter_assignments").select("counter_id").eq("staff_id",user.id).maybeSingle();
  if(!assignment)return <EmptyStaff profile={profile}/>;
  countersQuery=countersQuery.eq("id",assignment.counter_id);
 }
 const {data:counters}=await countersQuery;
 return <DashboardShell profile={profile}>{counters?.length?counters.map(counter=><StaffQueue key={counter.id} counter={counter}/>):<EmptyStaff profile={profile}/>}</DashboardShell>;
}
function DashboardShell({profile,children}:{profile:{name:string|null;role:string};children:ReactNode}){return <main className="min-h-screen bg-slate-50"><header className="border-b bg-white"><div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5"><div><p className="text-sm font-semibold text-blue-600">Queueless</p><h1 className="mt-1 text-xl font-bold">Staff Dashboard</h1></div><div className="flex items-center gap-4"><div className="text-right"><p className="font-medium">{profile.name}</p><p className="text-sm text-slate-500">{profile.role}</p></div><LogoutButton/></div></div></header><div className="mx-auto max-w-7xl px-6 py-10"><h2 className="text-3xl font-bold">Counter Operations</h2><p className="mt-2 text-slate-500">Manage your assigned queues in real time.</p><div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">{children}</div></div></main>}
function EmptyStaff({profile}:{profile:{name:string|null;role:string}}){return <DashboardShell profile={profile}><div className="rounded-3xl border bg-white p-10 text-center md:col-span-2 lg:col-span-3"><p className="text-5xl">🏢</p><h3 className="mt-5 text-2xl font-bold">No counter assigned</h3><p className="mt-2 text-slate-500">An administrator needs to assign you to a counter before you can operate the queue.</p></div></DashboardShell>}
