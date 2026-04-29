"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useAuth } from "./useAuth";

/**
 * Subscribes to real-time lead events via Server-Sent Events.
 *
 * Notifications shown:
 *  - Admin: "New lead added", "Lead assigned/reassigned", "Lead updated"
 *  - Agent: "A new lead has been assigned to you!" (only when it's their lead)
 *
 * Fallback: polls every 10 s when the SSE connection is closed.
 *
 * @param onRefresh  Stable callback (wrap in useCallback) to re-fetch UI data.
 */
export function useLeadSocket(onRefresh?: () => void) {
  const { user } = useAuth();

  // Keep a ref so the latest onRefresh is always available without
  // adding it to the dependency array (avoids reconnecting on every render).
  const onRefreshRef = useRef(onRefresh);
  useEffect(() => {
    onRefreshRef.current = onRefresh;
  });

  useEffect(() => {
    if (!user || typeof window === "undefined") return;

    // Capture in a const so TypeScript knows it can't be null inside callbacks
    const currentUser = user;

    let es: EventSource;
    let pollingTimer: ReturnType<typeof setInterval>;

    function connect() {
      es = new EventSource("/api/events");

      es.onopen = () => {
        // Clear fallback polling once SSE reconnects
        clearInterval(pollingTimer);
      };

      es.onmessage = (e: MessageEvent) => {
        let payload: { event: string; data?: any };
        try {
          payload = JSON.parse(e.data);
        } catch {
          return;
        }

        const { event, data } = payload;

        if (event === "connected") return; // initial handshake, nothing to do

        if (event === "new_lead") {
          if (currentUser.role === "admin") {
            toast.success(`New lead added: ${data?.lead?.name ?? "Unknown"}`);
          }
          onRefreshRef.current?.();
        } else if (event === "lead_assigned") {
          if (currentUser.role === "admin") {
            toast.info("A lead has been assigned / reassigned");
          } else if (data?.assignedTo === currentUser._id) {
            toast.success("🎉 A new lead has been assigned to you!");
          }
          onRefreshRef.current?.();
        } else if (event === "lead_updated") {
          if (currentUser.role === "admin") {
            toast.info("A lead was updated");
          } else {
            toast.info("One of your leads was updated");
          }
          onRefreshRef.current?.();
        }
      };

      es.onerror = () => {
        // SSE dropped — start fallback polling until it reconnects
        pollingTimer = setInterval(() => {
          if (es.readyState === EventSource.CLOSED) {
            onRefreshRef.current?.();
          }
        }, 10_000);
      };
    }

    connect();

    return () => {
      es?.close();
      clearInterval(pollingTimer);
    };
  }, [user]); // only reconnect when the logged-in user changes
}
