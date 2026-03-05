/**
 * Example: Mail Dashboard
 *
 * Lists your locations and recent mail for each one.
 *
 * Usage: STABLE_API_KEY=sk_... bun run examples/mail-dashboard.ts
 */

import { StableApiError, StableClient } from "../src/index.ts";

const apiKey = process.env.STABLE_API_KEY;
if (!apiKey) {
  console.error("Missing STABLE_API_KEY. Set it in .env or pass it inline.");
  process.exit(1);
}

const stable = new StableClient({
  apiKey,
  baseUrl: process.env.STABLE_BASE_URL,
});

try {
  const locations = await stable.listLocations({ first: 10 });
  const active = locations.edges
    .map((e) => e.node)
    .filter((l) => l.status === "active");

  if (active.length === 0) {
    console.log("No active locations found.");
    process.exit(0);
  }

  console.log(`${active.length} active location(s):\n`);

  // Fetch recent mail for each location in parallel
  const mailPages = await Promise.all(
    active.map((loc) => stable.listMailItems({ locationId: loc.id, first: 5 })),
  );

  for (const [i, location] of active.entries()) {
    const { city, state } = location.address;
    const items = mailPages[i]?.edges.map((e) => e.node) ?? [];

    console.log(`${city}, ${state} (${items.length} items):`);
    for (const item of items) {
      const scan =
        item.scanDetails?.status === "completed" ? "scanned" : "pending";
      console.log(`→ From: ${item.from} | Scan: ${scan}`);
    }
    console.log();
  }
} catch (err) {
  if (err instanceof StableApiError) {
    console.error(`API Error [${err.status}]: ${err.body}`);
  } else {
    console.error("Error:", err instanceof Error ? err.message : err);
  }
  process.exit(1);
}
