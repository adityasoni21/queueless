"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function TestSupabasePage() {
  const [services, setServices] = useState<any[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadServices() {
      const supabase = createClient();

      const { data, error } = await supabase
        .from("services")
        .select("*")
        .order("created_at");

      if (error) {
        setError(error.message);
        return;
      }

      setServices(data ?? []);
    }

    loadServices();
  }, []);

  return (
    <main className="min-h-screen p-10">
      <h1 className="text-3xl font-bold mb-6">
        Supabase Connection Test
      </h1>

      {error && (
        <div className="rounded-lg bg-red-100 p-4 text-red-700">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {services.map((service) => (
          <div
            key={service.id}
            className="rounded-xl border p-5"
          >
            <h2 className="font-semibold">
              {service.name}
            </h2>

            <p className="text-gray-600">
              {service.description}
            </p>

            <p className="mt-2 text-sm">
              Average service time:{" "}
              {service.average_service_time} minutes
            </p>
          </div>
        ))}
      </div>
    </main>
  );
}