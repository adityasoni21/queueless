"use client";

import { useCallback, useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";
import TokenQRCode from "./TokenQRCode";

interface Token {
  id: string;
  token_number: string;
  status: string;
  created_at: string;
  estimated_wait: number | null;
  counter_id: string;
  services: { name: string } | null;
  counters: {
    id: string;
    name: string;
    location: string | null;
  } | null;
}

interface QueueStatus {
  token_id: string;
  token_number: string;
  status: string;
  queue_position: number;
  estimated_wait: number;
  counter_id: string;
  service_id: string;
}

interface Props {
  initialToken: Token;
}

export default function TokenLiveView({ initialToken }: Props) {
  const supabase = createClient();
  const [token, setToken] = useState<Token>(initialToken);
  const [queueStatus, setQueueStatus] = useState<QueueStatus | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [notificationPermission, setNotificationPermission] =
    useState<NotificationPermission>("default");

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  async function requestNotificationPermission() {
    if (
      typeof window === "undefined" ||
      !("Notification" in window)
    ) {
      return;
    }

    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);
  }

  const refreshQueueStatus = useCallback(async () => {
    const { data, error } = await supabase.rpc("get_token_queue_status", {
      p_token_id: initialToken.id,
    });

    if (error) {
      console.error("Queue status error:", error);
      return;
    }

    const status = Array.isArray(data) ? data[0] : data;
    if (!status) return;

    setQueueStatus(status);
    setToken((current) => ({ ...current, status: status.status }));

    if (status.status === "WAITING" && status.estimated_wait <= 10) {
      const { data: notificationCreated } = await supabase.rpc(
        "check_turn_notification",
        { p_token_id: initialToken.id }
      );

      if (notificationCreated === true) {
        const message = "Your turn is approximately 10 minutes away.";
        setNotification(message);

        if (
          typeof window !== "undefined" &&
          "Notification" in window &&
          Notification.permission === "granted"
        ) {
          new Notification("CampusQueue — Your turn is approaching", {
            body: message,
          });
        }
      }
    }
  }, [initialToken.id, supabase]);

  const refreshToken = useCallback(async () => {
    const { data, error } = await supabase
      .from("tokens")
      .select(`
        *,
        services (name),
        counters (id, name, location)
      `)
      .eq("id", initialToken.id)
      .single();

    if (error) {
      console.error("Token refresh error:", error);
      return;
    }

    if (data) setToken(data as Token);
    await refreshQueueStatus();
  }, [initialToken.id, refreshQueueStatus, supabase]);

  useEffect(() => {
    refreshToken();
  }, [refreshToken]);

  // ETA changes while the current student is being served, even if no row changes.
  useEffect(() => {
    const interval = window.setInterval(refreshQueueStatus, 15000);
    return () => window.clearInterval(interval);
  }, [refreshQueueStatus]);

  useEffect(() => {
    const channel = supabase
      .channel(`student-token-${initialToken.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tokens",
          filter: `id=eq.${initialToken.id}`,
        },
        () => refreshToken()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [initialToken.id, refreshToken, supabase]);

  useEffect(() => {
    const channel = supabase
      .channel(`counter-queue-${token.counter_id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tokens",
          filter: `counter_id=eq.${token.counter_id}`,
        },
        () => refreshToken()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [token.counter_id, refreshToken, supabase]);

  const status = queueStatus?.status ?? token.status;
  const position = queueStatus?.queue_position ?? 0;
  const estimatedWait = queueStatus?.estimated_wait ?? token.estimated_wait ?? 0;
  const isWaiting = status === "WAITING";
  const isCalled = status === "CALLED";
  const isServing = status === "IN_SERVICE";
  const isCompleted = status === "COMPLETED";
  const isSkipped = status === "SKIPPED" || status === "NO_SHOW";

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-xl px-6 py-10">
        <a href="/student/dashboard" className="text-sm font-medium text-blue-600">
          ← Dashboard
        </a>

        <div className="mt-8 overflow-hidden rounded-3xl bg-white shadow-sm">
          <div className="bg-blue-600 px-8 py-10 text-center text-white">
            <p className="text-sm font-medium opacity-80">Your Token</p>
            <p className="mt-2 text-7xl font-black">{token.token_number}</p>
            <p className="mt-3">{token.services?.name}</p>
          </div>

          <div className="p-8">
            {notification && (
              <div className="mb-6 rounded-2xl bg-yellow-50 p-5">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">🔔</span>
                  <div>
                    <p className="font-semibold text-yellow-900">Your turn is approaching</p>
                    <p className="mt-1 text-sm text-yellow-800">{notification}</p>
                  </div>
                </div>
              </div>
            )}

            {isWaiting && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-2xl bg-slate-50 p-5">
                    <p className="text-sm text-slate-500">People ahead</p>
                    <p className="mt-1 text-3xl font-bold">{Math.max(0, position - 1)}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-5">
                    <p className="text-sm text-slate-500">Estimated wait</p>
                    <p className="mt-1 text-3xl font-bold">~{estimatedWait} min</p>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-blue-900">Virtual queue active</p>
                      <p className="mt-1 text-sm text-blue-800">
                        Your position and ETA update automatically as the counter serves students.
                      </p>
                    </div>
                    <div className="rounded-xl bg-white px-4 py-3 text-center shadow-sm">
                      <p className="text-xs font-medium text-slate-400">YOUR POSITION</p>
                      <p className="text-2xl font-black text-blue-700">#{position}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl bg-slate-50 p-5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-700">Queue progress</span>
                    <span className="text-slate-500">
                      {position > 0 ? `${position - 1} ahead` : "You're next"}
                    </span>
                  </div>
                  <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-blue-600 transition-all duration-500"
                      style={{
                        width: `${Math.min(100, Math.max(8, 100 - Math.max(0, position - 1) * 12))}%`,
                      }}
                    />
                  </div>
                </div>

                {notificationPermission !== "granted" && (
                  <button
                    onClick={requestNotificationPermission}
                    className="mt-4 w-full rounded-xl border border-blue-200 bg-white px-4 py-3 text-sm font-semibold text-blue-700 hover:bg-blue-50"
                  >
                    🔔 Enable Turn Notifications
                  </button>
                )}
              </>
            )}

            {isCalled && (
              <div className="rounded-2xl bg-yellow-50 p-6 text-center">
                <p className="text-sm font-medium text-yellow-700">YOUR TURN IS NOW</p>
                <p className="mt-2 text-3xl font-black text-yellow-900">
                  Please proceed to the counter.
                </p>
                <TokenQRCode tokenId={token.id} tokenNumber={token.token_number} />
              </div>
            )}

            {isServing && (
              <div className="rounded-2xl bg-green-50 p-6 text-center">
                <p className="text-sm font-medium text-green-700">IN SERVICE</p>
                <p className="mt-2 text-3xl font-black text-green-900">
                  Your request is being processed.
                </p>
              </div>
            )}

            {isCompleted && (
              <div className="rounded-2xl bg-green-50 p-6 text-center">
                <p className="text-sm font-medium text-green-700">COMPLETED</p>
                <p className="mt-2 text-2xl font-bold text-green-900">
                  Your service has been completed.
                </p>
              </div>
            )}

            {isSkipped && (
              <div className="rounded-2xl bg-red-50 p-6 text-center">
                <p className="text-sm font-medium text-red-700">TOKEN SKIPPED</p>
                <p className="mt-2 text-2xl font-bold text-red-900">
                  Your token was skipped.
                </p>
              </div>
            )}

            <div className="mt-6 rounded-2xl border p-5">
              <p className="text-sm text-slate-500">Counter</p>
              <p className="mt-1 font-semibold">{token.counters?.name}</p>
              <p className="text-sm text-slate-500">{token.counters?.location}</p>
            </div>

            <div className="mt-6 text-center text-xs text-slate-400">
              Live queue data refreshes automatically.
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
