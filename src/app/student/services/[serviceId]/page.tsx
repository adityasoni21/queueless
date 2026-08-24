import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import JoinQueueButton from "@/components/queue/JoinQueueButton";

interface ServicePageProps {
  params: Promise<{
    serviceId: string;
  }>;
}

export default async function ServicePage({
  params,
}: ServicePageProps) {
  const { serviceId } = await params;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: service } = await supabase
    .from("services")
    .select("*")
    .eq("id", serviceId)
    .eq("is_active", true)
    .single();

  if (!service) {
    notFound();
  }

  const { data: counterServices } = await supabase
    .from("counter_services")
    .select(`
      counter_id,
      counters (
        id,
        name,
        location,
        status
      )
    `)
    .eq("service_id", serviceId);

  const availableCounters =
    counterServices?.filter(
      (item: any) => item.counters?.status === "OPEN"
    ) ?? [];

  let totalWaiting = 0;

  for (const counter of availableCounters) {
    const counterId = (counter.counters as any).id;

    const { count } = await supabase
      .from("tokens")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq("counter_id", counterId)
      .in("status", ["WAITING", "CALLED", "IN_SERVICE"]);

    totalWaiting += count ?? 0;
  }

  const estimatedWait =
    totalWaiting * service.average_service_time;

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-4xl px-6 py-10">
        <a
          href="/student/dashboard"
          className="text-sm font-medium text-blue-600"
        >
          ← Back to services
        </a>

        <div className="mt-8 rounded-3xl bg-white p-8 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold text-blue-600">
                CampusQueue
              </p>

              <h1 className="mt-2 text-3xl font-bold">
                {service.name}
              </h1>

              <p className="mt-3 text-slate-500">
                {service.description}
              </p>
            </div>

            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                availableCounters.length > 0
                  ? "bg-green-50 text-green-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              {availableCounters.length > 0
                ? "Open"
                : "Closed"}
            </span>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-5">
              <p className="text-sm text-slate-500">
                People waiting
              </p>

              <p className="mt-1 text-3xl font-bold">
                {totalWaiting}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-5">
              <p className="text-sm text-slate-500">
                Estimated wait
              </p>

              <p className="mt-1 text-3xl font-bold">
                ~{estimatedWait} min
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-5">
              <p className="text-sm text-slate-500">
                Avg. service
              </p>

              <p className="mt-1 text-3xl font-bold">
                ~{service.average_service_time} min
              </p>
            </div>
          </div>

          <div className="mt-8">
            <h2 className="font-semibold">
              Available counters
            </h2>

            <div className="mt-3 space-y-3">
              {counterServices?.map((item: any) => {
                const counter = item.counters;

                return (
                  <div
                    key={counter.id}
                    className="flex items-center justify-between rounded-2xl border p-4"
                  >
                    <div>
                      <p className="font-medium">
                        {counter.name}
                      </p>

                      <p className="text-sm text-slate-500">
                        {counter.location}
                      </p>
                    </div>

                    <span
                      className={`text-sm font-medium ${
                        counter.status === "OPEN"
                          ? "text-green-600"
                          : "text-slate-400"
                      }`}
                    >
                      {counter.status}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-8 border-t pt-8">
            <JoinQueueButton
              serviceId={service.id}
              disabled={availableCounters.length === 0}
            />
          </div>
        </div>
      </div>
    </main>
  );
}