"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { createClient } from "@/lib/supabase/client";
import TokenQRCode from "./TokenQRCode";

interface Token {
  id: string;
  token_number: string;
  status: string;
  created_at: string;
  estimated_wait: number | null;
  counter_id: string;

  services: {
    name: string;
  } | null;

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

export default function TokenLiveView({
  initialToken,
}: Props) {
  const supabase = createClient();

  const [token, setToken] =
    useState<Token>(initialToken);

  const [queueStatus, setQueueStatus] =
    useState<QueueStatus | null>(null);

  const [notification, setNotification] =
    useState<string | null>(null);

  const [notificationPermission, setNotificationPermission] =
    useState<NotificationPermission>("default");

  /*
   * Ask for browser notification permission.
   */
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "Notification" in window
    ) {
      setNotificationPermission(
        Notification.permission
      );
    }
  }, []);

  async function requestNotificationPermission() {
    if (
      typeof window === "undefined" ||
      !("Notification" in window)
    ) {
      return;
    }

    const permission =
      await Notification.requestPermission();

    setNotificationPermission(permission);
  }

  /*
   * Get the latest token status + queue position.
   */
  const refreshQueueStatus =
    useCallback(async () => {
      const { data, error } =
        await supabase.rpc(
          "get_token_queue_status",
          {
            p_token_id: initialToken.id,
          }
        );

      if (error) {
        console.error(
          "Queue status error:",
          error
        );
        return;
      }

      const status =
        Array.isArray(data)
          ? data[0]
          : data;

      if (!status) {
        return;
      }

      setQueueStatus(status);

      /*
       * Update the token status too.
       */
      setToken((current) => ({
        ...current,
        status: status.status,
      }));

      /*
       * Check whether a 10-minute
       * notification should be created.
       */
      if (
        status.status === "WAITING" &&
        status.estimated_wait <= 10
      ) {
        const { data: notificationCreated } =
          await supabase.rpc(
            "check_turn_notification",
            {
              p_token_id: initialToken.id,
            }
          );

        if (notificationCreated === true) {
          const message =
            "Your turn is approximately 10 minutes away.";

          setNotification(message);

          /*
           * Browser notification.
           */
          if (
            typeof window !== "undefined" &&
            "Notification" in window &&
            Notification.permission ===
              "granted"
          ) {
            new Notification(
              "CampusQueue — Your turn is approaching",
              {
                body: message,
              }
            );
          }
        }
      }
    }, [initialToken.id, supabase]);

  /*
   * Get full token information.
   */
  const refreshToken = useCallback(async () => {
    const { data, error } =
      await supabase
        .from("tokens")
        .select(`
          *,
          services (
            name
          ),
          counters (
            id,
            name,
            location
          )
        `)
        .eq("id", initialToken.id)
        .single();

    if (error) {
      console.error(
        "Token refresh error:",
        error
      );

      return;
    }

    if (data) {
      setToken(data as Token);
    }

    await refreshQueueStatus();
  }, [
    initialToken.id,
    refreshQueueStatus,
    supabase,
  ]);

  /*
   * Initial load.
   */
  useEffect(() => {
    refreshToken();
  }, [refreshToken]);

  /*
   * Listen for changes to this token.
   */
  useEffect(() => {
    const channel =
      supabase
        .channel(
          `student-token-${initialToken.id}`
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "tokens",
            filter: `id=eq.${initialToken.id}`,
          },
          () => {
            refreshToken();
          }
        )
        .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [
    initialToken.id,
    refreshToken,
    supabase,
  ]);

  /*
   * Listen to the entire counter queue.
   */
  useEffect(() => {
    const channel =
      supabase
        .channel(
          `counter-queue-${token.counter_id}`
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "tokens",
            filter: `counter_id=eq.${token.counter_id}`,
          },
          () => {
            refreshToken();
          }
        )
        .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [
    token.counter_id,
    refreshToken,
    supabase,
  ]);

  const status =
    queueStatus?.status ?? token.status;

  const position =
    queueStatus?.queue_position ?? 0;

  const estimatedWait =
    queueStatus?.estimated_wait ??
    token.estimated_wait ??
    0;

  const isWaiting =
    status === "WAITING";

  const isCalled =
    status === "CALLED";

  const isServing =
    status === "IN_SERVICE";

  const isCompleted =
    status === "COMPLETED";

  const isSkipped =
    status === "SKIPPED" ||
    status === "NO_SHOW";

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-xl px-6 py-10">

        <a
          href="/student/dashboard"
          className="text-sm font-medium text-blue-600"
        >
          ← Dashboard
        </a>

        <div className="mt-8 overflow-hidden rounded-3xl bg-white shadow-sm">

          {/* TOKEN HEADER */}

          <div className="bg-blue-600 px-8 py-10 text-center text-white">

            <p className="text-sm font-medium opacity-80">
              Your Token
            </p>

            <p className="mt-2 text-7xl font-black">
              {token.token_number}
            </p>

            <p className="mt-3">
              {token.services?.name}
            </p>

          </div>

          <div className="p-8">

            {/* NOTIFICATION */}

            {notification && (
              <div className="mb-6 rounded-2xl bg-yellow-50 p-5">

                <div className="flex items-start gap-3">

                  <span className="text-2xl">
                    🔔
                  </span>

                  <div>
                    <p className="font-semibold text-yellow-900">
                      Your turn is approaching
                    </p>

                    <p className="mt-1 text-sm text-yellow-800">
                      {notification}
                    </p>
                  </div>

                </div>

              </div>
            )}

            {/* WAITING */}

            {isWaiting && (
              <>
                <div className="grid grid-cols-2 gap-4">

                  <div className="rounded-2xl bg-slate-50 p-5">

                    <p className="text-sm text-slate-500">
                      Queue position
                    </p>

                    <p className="mt-1 text-3xl font-bold">
                      #{position}
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

                </div>

                <div className="mt-6 rounded-2xl bg-blue-50 p-5">

                  <p className="font-semibold text-blue-900">
                    You're in the virtual queue
                  </p>

                  <p className="mt-2 text-sm text-blue-800">
                    You don't need to stand in the
                    physical queue. We'll update your
                    position automatically.
                  </p>

                </div>

                {/* NOTIFICATION PERMISSION */}

                {notificationPermission !==
                  "granted" && (
                  <button
                    onClick={
                      requestNotificationPermission
                    }
                    className="mt-4 w-full rounded-xl border border-blue-200 bg-white px-4 py-3 text-sm font-semibold text-blue-700 hover:bg-blue-50"
                  >
                    🔔 Enable Turn Notifications
                  </button>
                )}
              </>
            )}

            {/* CALLED */}

            {isCalled && (
              <div className="rounded-2xl bg-yellow-50 p-6 text-center">

                <p className="text-sm font-medium text-yellow-700">
                  YOUR TURN IS NOW
                </p>

                <p className="mt-2 text-3xl font-black text-yellow-900">
                  Please proceed to the counter.
                </p>
                <TokenQRCode
                  tokenId={token.id}
                  tokenNumber={token.token_number}
                />

              </div>
            )}

            {/* IN SERVICE */}

            {isServing && (
              <div className="rounded-2xl bg-green-50 p-6 text-center">

                <p className="text-sm font-medium text-green-700">
                  IN SERVICE
                </p>

                <p className="mt-2 text-3xl font-black text-green-900">
                  Your request is being processed.
                </p>

              </div>
            )}

            {/* COMPLETED */}

            {isCompleted && (
              <div className="rounded-2xl bg-green-50 p-6 text-center">

                <p className="text-sm font-medium text-green-700">
                  COMPLETED
                </p>

                <p className="mt-2 text-2xl font-bold text-green-900">
                  Your service has been completed.
                </p>

              </div>
            )}

            {/* SKIPPED */}

            {isSkipped && (
              <div className="rounded-2xl bg-red-50 p-6 text-center">

                <p className="text-sm font-medium text-red-700">
                  TOKEN SKIPPED
                </p>

                <p className="mt-2 text-2xl font-bold text-red-900">
                  Your token was skipped.
                </p>

              </div>
            )}

            {/* COUNTER */}

            <div className="mt-6 rounded-2xl border p-5">

              <p className="text-sm text-slate-500">
                Counter
              </p>

              <p className="mt-1 font-semibold">
                {token.counters?.name}
              </p>

              <p className="text-sm text-slate-500">
                {token.counters?.location}
              </p>

            </div>

            <div className="mt-6 text-center text-xs text-slate-400">
              Queue information updates automatically.
            </div>

          </div>
        </div>
      </div>
    </main>
  );
}