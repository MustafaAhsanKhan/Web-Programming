/**
 * lib/sse.ts
 *
 * Server-Sent Events broadcast utility.
 * Uses globalThis so the client Set survives Next.js Hot Module Reloads
 * and is shared across all App Router route handlers in the same process.
 */

declare global {
  // eslint-disable-next-line no-var
  var _sseClients: Set<ReadableStreamDefaultController> | undefined;
}

// Initialise once per process
if (!globalThis._sseClients) {
  globalThis._sseClients = new Set();
}

const clients = globalThis._sseClients;

export function addSseClient(ctrl: ReadableStreamDefaultController) {
  clients.add(ctrl);
}

export function removeSseClient(ctrl: ReadableStreamDefaultController) {
  clients.delete(ctrl);
}

/** Broadcast a named event to every connected browser tab. */
export function broadcastSseEvent(event: string, data: unknown) {
  const payload = new TextEncoder().encode(
    `data: ${JSON.stringify({ event, data })}\n\n`
  );
  clients.forEach((ctrl) => {
    try {
      ctrl.enqueue(payload);
    } catch {
      // Stream already closed — clean up
      clients.delete(ctrl);
    }
  });
}
