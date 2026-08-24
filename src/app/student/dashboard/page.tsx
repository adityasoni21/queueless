import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function StudentDashboard() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, student_id")
    .eq("id", user.id)
    .single();

  const { data: services } = await supabase
    .from("services")
    .select(
      "id, name, description, average_service_time, grace_period"
    )
    .eq("is_active", true)
    .order("created_at");

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div>
            <p className="text-sm font-semibold text-blue-600">
              CampusQueue
            </p>

            <h1 className="mt-1 text-xl font-bold">
              Student Dashboard
            </h1>
          </div>

          <div className="text-right">
            <p className="font-medium">
              {profile?.name ?? "Student"}
            </p>

            <p className="text-sm text-slate-500">
              {profile?.student_id}
            </p>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-10">
        <section>
          <p className="text-sm font-medium text-blue-600">
            Administrative Services
          </p>

          <h2 className="mt-2 text-3xl font-bold text-slate-900">
            What do you need today?
          </h2>

          <p className="mt-2 max-w-2xl text-slate-500">
            Choose a service to see available counters and
            estimated waiting time.
          </p>
        </section>

        <section className="mt-8 grid gap-5 md:grid-cols-2">
          {services?.map((service) => (
            <div
              key={service.id}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-semibold">
                    {service.name}
                  </h3>

                  <p className="mt-2 text-sm text-slate-500">
                    {service.description}
                  </p>
                </div>

                <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                  Available
                </span>
              </div>

              <div className="mt-6 flex items-center justify-between border-t pt-5">
                <div>
                  <p className="text-xs text-slate-500">
                    Avg. service time
                  </p>

                  <p className="font-semibold">
                    ~{service.average_service_time} min
                  </p>
                </div>

                <a
                  href={`/student/services/${service.id}`}
                  className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
                >
                  View Queue
                </a>
              </div>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}