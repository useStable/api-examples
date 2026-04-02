/**
 * Example: Download Check Images
 *
 * Downloads check images for all mail received in the last 7 days.
 * Image URLs are temporary (presigned URLs), so this script
 * fetches mail items and downloads their check images in one pass.
 *
 * Files are saved to a local `check-images/` directory as
 * `{checkId}_{imageType}.{ext}`.
 *
 * Usage: STABLE_API_KEY=sk_... bun run examples/download-check-images.ts
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

  const outputDir = join(import.meta.dir, "..", "check-images");
  await mkdir(outputDir, { recursive: true });

  let downloaded = 0;
  let skipped = 0;

  const params: ListMailItemsParams = {
    createdAt_gte: oneWeekAgo.toISOString(),
    first: 25,
  };

  const items = stable.paginate(stable.listMailItems, params);

  for await (const item of items) {
    if (!item.checks.length) continue;

    for (const check of item.checks) {
      if (!check.images.length) {
        skipped++;
        continue;
      }

      for (const image of check.images) {
        const ext = extname(new URL(image.url).pathname) || ".png";
        const filePath = join(outputDir, `${check.id}_${image.type}${ext}`);
        console.log(
          `Downloading ${image.type} for check ${check.id} ($${(check.amount / 100).toFixed(2)})...`,
        );

        const res = await fetch(image.url);
        if (!res.ok) {
          console.error(
            `  Failed to download ${check.id} ${image.type}: ${res.status} ${res.statusText}`,
          );
          skipped++;
          continue;
        }

        await writeFile(filePath, Buffer.from(await res.arrayBuffer()));
        downloaded++;
      }
    }
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
