/**
 * Example: Download Scanned Mail
 *
 * Downloads scanned content for all mail received in the last 7 days.
 * Scan URLs are temporary (presigned URLs), so this script
 * fetches mail items and downloads their scans in one pass.
 *
 * Files are saved to a local `scans/` directory as `{mailItemId}.{ext}`.
 *
 * Usage: STABLE_API_KEY=sk_... bun run examples/download-scans.ts
 */

import { mkdir, writeFile } from "node:fs/promises";
import { extname, join } from "node:path";
import {
  type ListMailItemsParams,
  StableApiError,
  StableClient,
} from "../src/index.ts";

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
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const outputDir = join(import.meta.dir, "..", "scans");
  await mkdir(outputDir, { recursive: true });

  let downloaded = 0;
  let skipped = 0;

  const params: ListMailItemsParams = {
    "scan.status": "completed",
    createdAt_gte: oneWeekAgo.toISOString(),
    first: 25,
  };

  const items = stable.paginate(stable.listMailItems, params);

  for await (const item of items) {
    const url = item.scanDetails?.imageUrl;
    if (!url) {
      skipped++;
      continue;
    }

    const ext = extname(new URL(url).pathname) || ".pdf";
    const filePath = join(outputDir, `${item.id}${ext}`);
    console.log(`Downloading scan for ${item.id} (from: ${item.from})...`);

    const res = await fetch(url);
    if (!res.ok) {
      console.error(
        `  Failed to download ${item.id}: ${res.status} ${res.statusText}`,
      );
      skipped++;
      continue;
    }

    await writeFile(filePath, Buffer.from(await res.arrayBuffer()));
    downloaded++;
  }

  console.log(`\nDone. ${downloaded} downloaded, ${skipped} skipped.`);
} catch (err) {
  if (err instanceof StableApiError) {
    console.error(`API Error [${err.status}]: ${err.body}`);
  } else {
    console.error("Error:", err instanceof Error ? err.message : err);
  }
  process.exit(1);
}
