"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface Props {
  serviceId: string;
  disabled?: boolean;
}

export default function JoinQueueButton({
  serviceId,
  disabled = false,
}: Props) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function joinQueue() {
    setLoading(true);
    setError("");

    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { data, error } = await supabase.rpc(
      "create_queue_token",
      {
        p_service_id: serviceId,
      }
    );

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push(`/student/token/${data.id}`);
    router.refresh();
  }

  return (
    <div>
      <button
        onClick={joinQueue}
        disabled={disabled || loading}
        className="w-full rounded-2xl bg-blue-600 px-6 py-4 text-lg font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Joining queue..." : "Join Queue"}
      </button>

      {error && (
        <p className="mt-3 text-center text-sm text-red-600">
          {error}
        </p>
      )}

      <p className="mt-3 text-center text-xs text-slate-400">
        Your estimated waiting time may change as the queue moves.
      </p>
    </div>
  );
}