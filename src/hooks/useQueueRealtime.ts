"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface UseQueueRealtimeProps {
  counterId: string;
  onChange: () => void;
}

export function useQueueRealtime({
  counterId,
  onChange,
}: UseQueueRealtimeProps) {
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`queue-${counterId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tokens",
          filter: `counter_id=eq.${counterId}`,
        },
        () => {
          onChange();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [counterId, onChange]);
}