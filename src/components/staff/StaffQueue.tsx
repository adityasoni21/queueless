"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import LiveIndicator from "@/components/ui/LiveIndicator";

interface Counter {
  id: string;
  name: string;
  location: string | null;
  status: "OPEN" | "CLOSED" | "PAUSED";
}

interface Token {
  id: string;
  token_number: string;
  status: string;
  created_at: string;
  service_started_at: string | null;
  arrived_at: string | null;
  services: {
    name: string;
  } | null;
}

interface Props {
  counter: Counter;
}

export default function StaffQueue({
  counter,
}: Props) {
  const supabase = createClient();

  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadQueue() {
    const { data, error } = await supabase
      .from("tokens")
      .select(`
        id,
        token_number,
        status,
        created_at,
        service_started_at,
        arrived_at,
        services (
          name
        )
      `)
      .eq("counter_id", counter.id)
      .in("status", [
        "WAITING",
        "CALLED",
        "IN_SERVICE",
      ])
      .order("created_at", {
        ascending: true,
      });

    if (error) {
      setError(error.message);
      return;
    }

    setTokens((data as Token[]) ?? []);
  }

  useEffect(() => {
    loadQueue();

    const channel = supabase
      .channel(`counter-${counter.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tokens",
          filter: `counter_id=eq.${counter.id}`,
        },
        () => {
          loadQueue();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [counter.id]);

  async function openCounter() {
    setLoading(true);
    setError("");

    const { error } = await supabase.rpc(
      "open_counter",
      {
        p_counter_id: counter.id,
      }
    );

    if (error) {
      setError(error.message);
    }

    await loadQueue();
    setLoading(false);
  }

  async function closeCounter() {
    setLoading(true);
    setError("");

    const { error } = await supabase.rpc(
      "close_counter",
      {
        p_counter_id: counter.id,
        p_reason: "Closed by staff",
      }
    );

    if (error) {
      setError(error.message);
    }

    await loadQueue();
    setLoading(false);
  }

  async function callNext() {
    setLoading(true);
    setError("");

    const { error } = await supabase.rpc(
      "call_next_token",
      {
        p_counter_id: counter.id,
      }
    );

    if (error) {
      setError(error.message);
    }

    await loadQueue();
    setLoading(false);
  }

  async function startService(tokenId: string) {
    setLoading(true);
    setError("");

    const { error } = await supabase.rpc(
      "start_token_service",
      {
        p_token_id: tokenId,
      }
    );

    if (error) {
      setError(error.message);
    }

    await loadQueue();
    setLoading(false);
  }

  async function completeToken(tokenId: string) {
    setLoading(true);
    setError("");

    const { error } = await supabase.rpc(
      "complete_token",
      {
        p_token_id: tokenId,
      }
    );

    if (error) {
      setError(error.message);
    }

    await loadQueue();
    setLoading(false);
  }

  async function skipToken(tokenId: string) {
    setLoading(true);
    setError("");

    const { error } = await supabase.rpc(
      "skip_token",
      {
        p_token_id: tokenId,
      }
    );

    if (error) {
      setError(error.message);
    }

    await loadQueue();
    setLoading(false);
  }

  const currentToken = tokens.find(
    (token) =>
      token.status === "CALLED" ||
      token.status === "IN_SERVICE"
  );

  const waitingTokens = tokens.filter(
    (token) => token.status === "WAITING"
  );

  return (
    <div className="overflow-hidden rounded-3xl border bg-white shadow-sm">
      <div className="border-b p-6">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-xl font-bold">
              {counter.name}
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              {counter.location}
            </p>
          </div>

          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              counter.status === "OPEN"
                ? "bg-green-50 text-green-700"
                : counter.status === "PAUSED"
                  ? "bg-yellow-50 text-yellow-700"
                  : "bg-slate-100 text-slate-500"
            }`}
          >
            {counter.status}
          </span>
        </div>
      </div>

      <div className="p-6">
        {currentToken ? (
          <div>
            <p className="text-sm font-medium text-slate-500">
              NOW SERVING
            </p>
            <LiveIndicator />

            <p className="mt-2 text-6xl font-black tracking-tight">
              {currentToken.token_number}
            </p>

            <p className="mt-2 font-medium">
              {currentToken.services?.name}
            </p>

            <div className="mt-6 flex gap-3">
              {currentToken.status === "CALLED" && (
                <button
                  onClick={() =>
                    startService(currentToken.id)
                  }
                  disabled={
                    loading ||
                    !currentToken.arrived_at
                  }
                  className="flex-1 rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white disabled:opacity-40"
                >
                  {currentToken.arrived_at
                    ? "Start Service"
                    : "Waiting for Arrival"
                  }
                </button>
              )}

              {currentToken.arrived_at ? (
                  <div className="mt-4 rounded-xl bg-green-50 p-3 text-sm text-green-700">
                    ✓ Student has checked in
                  </div>
                ) : (
                  <div className="mt-4 rounded-xl bg-yellow-50 p-3 text-sm text-yellow-700">
                    Waiting for student to arrive
                  </div>
                )}

              {currentToken.status === "IN_SERVICE" && (
                <button
                  onClick={() =>
                    completeToken(currentToken.id)
                  }
                  disabled={loading}
                  className="flex-1 rounded-xl bg-green-600 px-4 py-3 font-semibold text-white"
                >
                  Complete
                </button>
              )}

              <button
                onClick={() =>
                  skipToken(currentToken.id)
                }
                disabled={loading}
                className="rounded-xl border px-4 py-3 font-semibold"
              >
                Skip
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl bg-slate-50 p-6 text-center">
            <p className="text-sm text-slate-500">
              No student currently being served
            </p>

            <p className="mt-2 text-4xl font-bold">
              —
            </p>
          </div>
        )}

        <div className="mt-8 border-t pt-6">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold">
              Waiting Queue
            </h4>
            <p className="mt-1 text-xs text-slate-400">
            {waitingTokens.length} student
            {waitingTokens.length === 1 ? "" : "s"} waiting
            </p>

            <span className="text-sm text-slate-500">
              {waitingTokens.length} waiting
            </span>
          </div>

          <div className="mt-4 space-y-2">
            {waitingTokens.map((token, index) => (
              <div
                key={token.id}
                className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <span className="font-bold">
                    #{index + 1}
                  </span>

                  <span className="font-semibold">
                    {token.token_number}
                  </span>
                </div>

                <span className="text-sm text-slate-500">
                  {token.services?.name}
                </span>
              </div>
            ))}

            {waitingTokens.length === 0 && (
              <p className="py-4 text-center text-sm text-slate-400">
                No students waiting
              </p>
            )}
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          {counter.status === "OPEN" ? (
            <>
              <button
                onClick={callNext}
                disabled={
                  loading ||
                  waitingTokens.length === 0 ||
                  !!currentToken
                }
                className="flex-1 rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white disabled:opacity-40"
              >
                Call Next
              </button>

              <button
                onClick={closeCounter}
                disabled={loading}
                className="rounded-xl border px-4 py-3 font-semibold"
              >
                Close
              </button>
            </>
          ) : (
            <button
              onClick={openCounter}
              disabled={loading}
              className="w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white"
            >
              Open Counter
            </button>
          )}
        </div>

        {error && (
          <div className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}