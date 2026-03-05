/**
 * Example: AI Mail Summary
 *
 * Fetches scanned mail and uses OpenAI to generate a daily digest.
 *
 * Requires: `bun install openai`
 * Usage:    STABLE_API_KEY=sk_... OPENAI_API_KEY=sk-... bun run examples/ai-mail-summary.ts
 */

import { StableApiError, StableClient } from "../src/index.ts";

const stableKey = process.env.STABLE_API_KEY;
const openaiKey = process.env.OPENAI_API_KEY;

if (!stableKey) {
  console.error("Missing STABLE_API_KEY.");
  process.exit(1);
}
if (!openaiKey) {
  console.error("Missing OPENAI_API_KEY.");
  process.exit(1);
}

const { default: OpenAI } = await import("openai").catch(() => {
  console.error('Requires "openai" package. Install with: bun install openai');
  process.exit(1);
});

const stable = new StableClient({
  apiKey: stableKey,
  baseUrl: process.env.STABLE_BASE_URL,
});
const openai = new OpenAI({
  apiKey: openaiKey,
  baseURL: process.env.OPENAI_BASE_URL,
});

try {
  const mail = await stable.listMailItems({
    "scan.status": "completed",
    first: 20,
  });
  const items = mail.edges.map((e) => e.node);

  if (items.length === 0) {
    console.log("No scanned mail found.");
    process.exit(0);
  }

  console.log(`Found ${items.length} scanned items. Generating digest...`);

  const mailList = items
    .map(
      (item, i) =>
        `${i + 1}. From: ${item.from}\n   Content: ${item.scanDetails?.summary ?? "No summary"}`,
    )
    .join("\n");

  const response = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL ?? "gpt-5.4",
    messages: [
      {
        role: "system",
        content:
          "You are a concise executive assistant. Summarize the following mail items into a brief daily digest. Group by priority: urgent first, informational second, junk last. Keep it under 200 words.",
      },
      { role: "user", content: `Today's scanned mail:\n\n${mailList}` },
    ],
  });

  const digest =
    response.choices[0]?.message.content ?? "No summary generated.";
  console.log(`\n--- Daily Mail Digest (${items.length} items) ---\n`);
  console.log(digest);
  console.log("\n--- End Digest ---\n");
} catch (err) {
  if (err instanceof StableApiError) {
    console.error(`Stable API Error [${err.status}]: ${err.body}`);
  } else {
    console.error("Error:", err instanceof Error ? err.message : err);
  }
  process.exit(1);
}
