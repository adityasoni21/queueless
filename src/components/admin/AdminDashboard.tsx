"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  createClient
} from "@/lib/supabase/client";

interface Props {
  profile: {
    name: string;
    role: string;
  };
}

interface Stats {
  total_today: number;
  served_today: number;
  waiting_now: number;
  average_wait_minutes: number;
  average_service_minutes: number;
  no_show_rate: number;
}

interface ServiceDemand {
  service_name: string;
  total_tokens: number;
}

interface Counter {
  counter_id: string;
  counter_name: string;
  location: string | null;
  status: string;
  waiting_count: number;
  current_token: string | null;
}

interface HourlyDemand {
  hour_label: string;
  total_tokens: number;
}

export default function AdminDashboard({
  profile,
}: Props) {

  const supabase = createClient();

  const [stats, setStats] =
    useState<Stats | null>(null);

  const [services, setServices] =
    useState<ServiceDemand[]>([]);

  const [counters, setCounters] =
    useState<Counter[]>([]);

  const [hourly, setHourly] =
    useState<HourlyDemand[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const loadDashboard =
    useCallback(async () => {

      setError("");

      const [
        statsResult,
        serviceResult,
        counterResult,
        hourlyResult,
      ] = await Promise.all([

        supabase.rpc(
          "get_admin_dashboard_stats"
        ),

        supabase.rpc(
          "get_service_demand"
        ),

        supabase.rpc(
          "get_counter_dashboard"
        ),

        supabase.rpc(
          "get_hourly_demand"
        ),

      ]);

      if (statsResult.error) {
        setError(
          statsResult.error.message
        );
        setLoading(false);
        return;
      }

      if (serviceResult.error) {
        setError(
          serviceResult.error.message
        );
        setLoading(false);
        return;
      }

      if (counterResult.error) {
        setError(
          counterResult.error.message
        );
        setLoading(false);
        return;
      }

      if (hourlyResult.error) {
        setError(
          hourlyResult.error.message
        );
        setLoading(false);
        return;
      }

      setStats(
        statsResult.data as Stats
      );

      setServices(
        (serviceResult.data ??
          []) as ServiceDemand[]
      );

      setCounters(
        (counterResult.data ??
          []) as Counter[]
      );

      setHourly(
        (hourlyResult.data ??
          []) as HourlyDemand[]
      );

      setLoading(false);

    }, [supabase]);

  useEffect(() => {
    const channel = supabase
        .channel("admin-dashboard")
        .on(
        "postgres_changes",
        {
            event: "*",
            schema: "public",
            table: "tokens",
        },
        () => {
            loadDashboard();
        }
        )
        .on(
        "postgres_changes",
        {
            event: "*",
            schema: "public",
            table: "counters",
        },
        () => {
            loadDashboard();
        }
        )
        .subscribe();

    return () => {
        supabase.removeChannel(channel);
    };
    }, [loadDashboard, supabase]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-slate-500">
          Loading dashboard...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">

      {/* HEADER */}

      <header className="border-b bg-white">

        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">

          <div>

            <p className="text-sm font-semibold text-blue-600">
              CampusQueue
            </p>

            <h1 className="mt-1 text-xl font-bold">
              Administration Dashboard
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

        {/* TITLE */}

        <div>

          <h2 className="text-3xl font-bold">
            Campus Operations
          </h2>

          <p className="mt-2 text-slate-500">
            Live overview of administrative
            service queues.
          </p>

        </div>

        {error && (
          <div className="mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* KPI CARDS */}

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

          <StatCard
            title="Students Today"
            value={stats?.total_today ?? 0}
          />

          <StatCard
            title="Currently Waiting"
            value={stats?.waiting_now ?? 0}
          />

          <StatCard
            title="Served Today"
            value={stats?.served_today ?? 0}
          />

          <StatCard
            title="Avg. Wait"
            value={`${stats?.average_wait_minutes ?? 0} min`}
          />

          <StatCard
            title="Avg. Service"
            value={`${stats?.average_service_minutes ?? 0} min`}
          />

          <StatCard
            title="No-show Rate"
            value={`${stats?.no_show_rate ?? 0}%`}
          />

        </div>
        {stats && (
            <div className="mt-6 rounded-2xl border bg-blue-50 p-5">

                <p className="text-sm font-semibold text-blue-900">
                Operational Insight
                </p>

                <p className="mt-1 text-sm text-blue-800">
                {stats.waiting_now > 10
                    ? "Queue demand is currently high. Consider opening an additional counter."
                    : stats.average_wait_minutes > 10
                    ? "Average waiting time is elevated. Consider reallocating staff during peak demand."
                    : "Queue performance is currently healthy."}
                </p>

            </div>
            )}

        {/* COUNTERS */}

        <section className="mt-8">

          <h3 className="text-xl font-bold">
            Live Counter Status
          </h3>

          <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">

            {counters.map(
              (counter) => (

                <div
                  key={counter.counter_id}
                  className="rounded-2xl border bg-white p-5 shadow-sm"
                >

                  <div className="flex items-start justify-between">

                    <div>

                      <p className="font-semibold">
                        {counter.counter_name}
                      </p>

                      <p className="text-sm text-slate-500">
                        {counter.location}
                      </p>

                    </div>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        counter.status ===
                        "OPEN"
                          ? "bg-green-50 text-green-700"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {counter.status}
                    </span>

                  </div>

                  <div className="mt-6 grid grid-cols-2 gap-3">

                    <div className="rounded-xl bg-slate-50 p-3">

                      <p className="text-xs text-slate-500">
                        Waiting
                      </p>

                      <p className="mt-1 text-2xl font-bold">
                        {counter.waiting_count}
                      </p>

                    </div>

                    <div className="rounded-xl bg-slate-50 p-3">

                      <p className="text-xs text-slate-500">
                        Current
                      </p>

                      <p className="mt-1 text-2xl font-bold">
                        {counter.current_token ??
                          "—"}
                      </p>

                    </div>

                  </div>

                </div>

              )
            )}

          </div>

        </section>

        {/* SERVICE DEMAND */}

        <section className="mt-10">

          <h3 className="text-xl font-bold">
            Service Demand
          </h3>

          <div className="mt-4 rounded-2xl border bg-white p-6 shadow-sm">

            {services.map(
              (service) => {

                const max =
                  Math.max(
                    ...services.map(
                      s =>
                        Number(
                          s.total_tokens
                        )
                    ),
                    1
                  );

                const percentage =
                  (
                    Number(
                      service.total_tokens
                    ) / max
                  ) * 100;

                return (
                  <div
                    key={service.service_name}
                    className="mb-5 last:mb-0"
                  >

                    <div className="flex justify-between text-sm">

                      <span className="font-medium">
                        {service.service_name}
                      </span>

                      <span className="text-slate-500">
                        {service.total_tokens}
                      </span>

                    </div>

                    <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-100">

                      <div
                        className="h-full rounded-full bg-blue-600"
                        style={{
                          width:
                            `${percentage}%`,
                        }}
                      />

                    </div>

                  </div>
                );
              }
            )}

          </div>

        </section>

        {/* HOURLY DEMAND */}

        <section className="mt-10">

          <h3 className="text-xl font-bold">
            Today's Queue Activity
          </h3>

          <div className="mt-4 rounded-2xl border bg-white p-6 shadow-sm">

            <div className="flex h-64 items-end gap-2">

              {hourly.map(
                (item) => {

                  const max =
                    Math.max(
                      ...hourly.map(
                        h =>
                          Number(
                            h.total_tokens
                          )
                      ),
                      1
                    );

                  const height =
                    (
                      Number(
                        item.total_tokens
                      ) / max
                    ) * 100;

                  return (
                    <div
                      key={item.hour_label}
                      className="flex h-full flex-1 flex-col justify-end"
                    >

                      <div
                        className="w-full rounded-t-lg bg-blue-500"
                        style={{
                          height:
                            `${Math.max(
                              height,
                              2
                            )}%`,
                        }}
                        title={`${item.total_tokens} tokens`}
                      />

                      <p className="mt-2 text-center text-xs text-slate-400">
                        {item.hour_label}
                      </p>

                    </div>
                  );

                }
              )}

            </div>

          </div>

        </section>

      </div>

    </main>
  );
}

function StatCard({
  title,
  value,
}: {
  title: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm">

      <p className="text-sm text-slate-500">
        {title}
      </p>

      <p className="mt-2 text-3xl font-bold">
        {value}
      </p>

    </div>
  );
}