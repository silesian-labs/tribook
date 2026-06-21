/**
 * Next.js instrumentation hook — runs once when the server process starts.
 * https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation
 *
 * We use it to kick off the NAV indexer poller immediately at server boot
 * instead of waiting for the first HTTP request to /api/nav-history.
 */
export async function register() {
  // Only run on the Node.js server side (not in the browser bundle or Edge).
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Dynamically import the poller starter so the module is only evaluated
    // server-side and the build doesn't try to include it in the client bundle.
    const { startNavPoller } = await import("./lib/nav-poller");
    startNavPoller();
  }
}
