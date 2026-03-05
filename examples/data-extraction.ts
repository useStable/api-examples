/**
 * Example: Data Extraction Results
 *
 * Fetches mail items that have completed data extraction and prints
 * the extracted key-value data for each item.
 *
 * Usage: STABLE_API_KEY=sk_... bun run examples/data-extraction.ts
 */

import { StableApiError, StableClient } from "../src/index.ts";

const apiKey = process.env.STABLE_API_KEY;
if (!apiKey) {
  console.error("Missing STABLE_API_KEY.");
  process.exit(1);
}

const stable = new StableClient({
  apiKey,
  baseUrl: process.env.STABLE_BASE_URL,
});

try {
  const mail = await stable.listMailItems({
    "scan.status": "completed",
    first: 20,
  });
  const items = mail.edges.map((e) => e.node);

  // Filter to items that have at least one successful extraction
  const withExtractions = items.filter((item) =>
    item.dataExtractionResults.some((r) => r.status === "succeeded"),
  );

  if (withExtractions.length === 0) {
    console.log("No mail items with completed data extractions found.");
    process.exit(0);
  }

  console.log(`${withExtractions.length} item(s) with extracted data:\n`);

  for (const item of withExtractions) {
    console.log(`From: ${item.from}`);

    for (const result of item.dataExtractionResults) {
      if (result.status !== "succeeded") {
        continue;
      }

      console.log(`Extractor: ${result.extractor.name}`);
      if (result.extractedData.length > 0) {
        console.log(JSON.stringify(result.extractedData, null, 2));
      } else {
        console.log("(no data)");
      }
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
