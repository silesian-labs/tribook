export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startNavPoller } = await import("./lib/nav-poller");
    startNavPoller();
  }
}
