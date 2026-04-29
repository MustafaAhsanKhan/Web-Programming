import { NextRequest } from "next/server";
import { addSseClient, removeSseClient } from "@/lib/sse";

// Never cache this route
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const enc = new TextEncoder();

  const stream = new ReadableStream({
    start(ctrl) {
      addSseClient(ctrl);

      // Immediate confirmation so the browser knows it's connected
      ctrl.enqueue(enc.encode(`data: ${JSON.stringify({ event: "connected" })}\n\n`));

      // Heartbeat comment every 25 s keeps the connection alive through proxies
      const heartbeat = setInterval(() => {
        try {
          ctrl.enqueue(enc.encode(": heartbeat\n\n"));
        } catch {
          clearInterval(heartbeat);
          removeSseClient(ctrl);
        }
      }, 25_000);

      // Clean up when the client disconnects (tab closed, navigation, etc.)
      request.signal.addEventListener("abort", () => {
        clearInterval(heartbeat);
        removeSseClient(ctrl);
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no", // disable nginx buffering
    },
  });
}
