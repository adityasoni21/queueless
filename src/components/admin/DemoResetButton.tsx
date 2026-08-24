"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function DemoResetButton() {
  const supabase = createClient();
  const router = useRouter();

  const [loading, setLoading] =
    useState(false);

  const [message, setMessage] =
    useState("");

  async function resetDemo() {

    const confirmed =
      window.confirm(
        "Reset all queue data? This cannot be undone."
      );

    if (!confirmed) {
      return;
    }

    setLoading(true);
    setMessage("");

    const { error } =
      await supabase.rpc(
        "reset_demo_queue"
      );

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    setMessage(
      "Demo queue has been reset."
    );

    router.refresh();

    setLoading(false);
  }

  return (
    <div>

      <button
        onClick={resetDemo}
        disabled={loading}
        className="rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
      >
        {loading
          ? "Resetting..."
          : "Reset Demo Queue"}
      </button>

      {message && (
        <p className="mt-2 text-xs text-slate-500">
          {message}
        </p>
      )}

    </div>
  );
}