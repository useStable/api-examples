# Stable API Examples

```text
     _        _     _
 ___| |_ __ _| |__ | | ___
/ __| __/ _` | '_ \| |/ _ \
\__ \ || (_| | |_) | |  __/
|___/\__\__,_|_.__/|_|\___|
```

TypeScript client and examples for the [Stable REST API](https://docs.usestable.com). Built with [Bun](https://bun.sh).

## Setup

Install [Bun](https://bun.sh), then:

```bash
bun install
cp .env.example .env  # add your API key
```

## Examples

All examples need a `STABLE_API_KEY` set in your `.env` file (see [Setup](#setup)). You can also pass it inline: `STABLE_API_KEY=sk_... bun run example:dashboard`.

### Mail Dashboard

> So you want to see all your locations and what mail came in recently.

Iterates over your active locations and fetches the latest mail items for each one — a quick overview of what's arriving and where.

```bash
bun run example:dashboard
```

<details>
<summary>Source</summary>

[`examples/mail-dashboard.ts`](examples/mail-dashboard.ts)

</details>

---

### AI Mail Digest

> So you want an AI-generated summary of today's mail.

Pulls your scanned mail and sends it to OpenAI (or any compatible API) to produce a prioritized daily digest — urgent items first, junk last.

Requires the `openai` package and an `OPENAI_API_KEY`:

```bash
bun install openai
bun run example:digest
```

Supports `OPENAI_BASE_URL` and `OPENAI_MODEL` env vars for use with Ollama or other compatible APIs.

<details>
<summary>Source</summary>

[`examples/ai-mail-summary.ts`](examples/ai-mail-summary.ts)

</details>

---

### Data Extraction

> So you want to pull structured data out of your scanned mail.

Fetches mail items that have completed data extraction and prints the extracted key-value results for each item — useful for invoices, checks, forms, or any mail with structured content.

```bash
bun run example:extract
```

<details>
<summary>Source</summary>

[`examples/data-extraction.ts`](examples/data-extraction.ts)

</details>

---

### Download Scanned Mail

> So you want to download all the PDFs from the last week.

Paginates through mail items with completed scans from the past 7 days and downloads each scan to a local `scans/` directory. Scan URLs are presigned S3 links (~24h expiry), so files are downloaded in one pass.

```bash
bun run example:download-scans
```

<details>
<summary>Source</summary>

[`examples/download-scans.ts`](examples/download-scans.ts)

</details>

## Client Usage

```ts
import { StableClient } from "./src/index.ts";

const stable = new StableClient({ apiKey: process.env.STABLE_API_KEY! });

const locations = await stable.listLocations({ first: 10 });

const mail = await stable.listMailItems({
  locationId: "loc_abc123",
  "scan.status": "completed",
  first: 20,
});

const item = await stable.getMailItem("mail-item-uuid");

for await (const item of stable.paginate(stable.listMailItems, { first: 50 })) {
  console.log(item.id, item.from);
}
```

## API Coverage

| Method | Endpoint | Client Method |
| ------ | -------- | ------------- |
| GET | `/v1/locations` | `listLocations()` |
| GET | `/v1/locations/:id` | `getLocation()` |
| POST | `/v1/locations` | `createLocation()` |
| POST | `/v1/locations/:id/deactivate` | `deactivateLocation()` |
| GET | `/v1/mail-items` | `listMailItems()` |
| GET | `/v1/mail-items/:id` | `getMailItem()` |
| GET | `/v1/tags` | `listTags()` |

All list endpoints return cursor-paginated connections (`first`/`after`/`last`/`before`).

## Development

```bash
bun run check    # lint (biome)
bun run format   # auto-format (biome)
```
