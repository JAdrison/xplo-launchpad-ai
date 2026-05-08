import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Subscribe to postgres_changes on one or more tables and invoke `onChange`
 * whenever any INSERT/UPDATE/DELETE happens. Optionally scoped by client_id.
 *
 * Use to keep cards/lists in sync after the user (or another tab) creates,
 * edits or deletes a document, so the next AI generation step always sees
 * fresh data.
 */
export function useRealtimeReload(
  tables: string[],
  onChange: () => void,
  opts: { clientId?: string | null; enabled?: boolean } = {}
) {
  const cbRef = useRef(onChange);
  cbRef.current = onChange;

  const enabled = opts.enabled ?? true;
  const clientId = opts.clientId ?? null;
  const key = tables.join(",");

  useEffect(() => {
    if (!enabled) return;
    const channelName = `rt-${key}-${clientId ?? "all"}-${Math.random().toString(36).slice(2, 8)}`;
    let channel = supabase.channel(channelName);
    for (const table of tables) {
      channel = channel.on(
        "postgres_changes" as never,
        {
          event: "*",
          schema: "public",
          table,
          ...(clientId ? { filter: `client_id=eq.${clientId}` } : {}),
        } as never,
        () => cbRef.current()
      );
    }
    channel.subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, clientId, enabled]);
}
