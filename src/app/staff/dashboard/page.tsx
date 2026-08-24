import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import StaffQueue from "@/components/staff/StaffQueue";

export default async function StaffDashboard() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, role")
    .eq("id", user.id)
    .single();

  if (
    !profile ||
    !["STAFF", "ADMIN"].includes(profile.role)
  ) {
    redirect("/dashboard");
  }

  const { data: counters } = await supabase
    .from("counters")
    .select("*")
    .order("name");

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div>
            <p className="text-sm font-semibold text-blue-600">
              CampusQueue
            </p>

            <h1 className="mt-1 text-xl font-bold">
              Staff Dashboard
            </h1>
          </div>

          <div className="text-right">
            <p className="font-medium">
              {profile.name}
            </p>

            <p className="text-sm text-slate-500">
              {profile.role}
            </p>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-10">
        <div>
          <h2 className="text-3xl font-bold">
            Counter Operations
          </h2>

          <p className="mt-2 text-slate-500">
            Manage your assigned queues in real time.
          </p>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {counters?.map((counter) => (
            <StaffQueue
              key={counter.id}
              counter={counter}
            />
          ))}
        </div>
      </div>
    </main>
  );
}