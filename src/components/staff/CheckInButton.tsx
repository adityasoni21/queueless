"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface Props {
  tokenId: string;
  alreadyCheckedIn: boolean;
}

export default function CheckInButton({
  tokenId,
  alreadyCheckedIn,
}: Props) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function checkIn() {
    setLoading(true);
    setError("");

    const supabase = createClient();

    const { error } = await supabase.rpc(
      "check_in_token",
      {
        p_token_id: tokenId,
      }
    );

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.refresh();
  }

  return (
    <div className="mt-6">
      <button
        onClick={checkIn}
        disabled={alreadyCheckedIn || loading}
        className="w-full rounded-2xl bg-green-600 px-5 py-4 font-semibold text-white disabled:opacity-50"
      >
        {loading
          ? "Checking in..."
          : alreadyCheckedIn
            ? "✓ Student Checked In"
            : "Confirm Arrival"}
      </button>

      {error && (
        <p className="mt-3 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}