import type {
  Connection,
  CreateLocationParams,
  ListLocationsParams,
  ListMailItemsParams,
  Location,
  MailItem,
  Tag,
} from "./types.ts";

/** Default Stable API base URL. Override in {@link StableClientOptions} for testing. */
const DEFAULT_BASE_URL = "https://api.usestable.com/v1";

/** Configuration options for {@link StableClient}. */
export interface StableClientOptions {
  /**
   * Your Stable API key. Passed as the `x-api-key` header on every request.
   *
   * @see https://docs.usestable.com/reference/authentication
   */
  apiKey: string;
  /**
   * Override the API base URL. Useful for testing against a local server or
   * staging environment. Defaults to `https://api.usestable.com/v1`.
   */
  baseUrl?: string;
}

/**
 * Thrown when the Stable API returns a non-2xx response.
 *
 * @example
 * ```ts
 * try {
 *   await stable.getMailItem("bad-id");
 * } catch (err) {
 *   if (err instanceof StableApiError && err.status === 404) {
 *     console.log("Mail item not found");
 *   }
 * }
 * ```
 */
export class StableApiError extends Error {
  /** HTTP status code from the response. */
  readonly status: number;
  /** Raw response body text. */
  readonly body: string;

  constructor(status: number, statusText: string, body: string) {
    super(`${status} ${statusText}: ${body}`);
    this.name = "StableApiError";
    this.status = status;
    this.body = body;
  }
}

/**
 * A lightweight client for the Stable REST API.
 *
 * Uses native `fetch` — no external dependencies. Handles authentication,
 * serialization, error handling, and provides a pagination helper.
 *
 * @example
 * ```ts
 * import { StableClient } from "./client.ts";
 *
 * const stable = new StableClient({ apiKey: process.env.STABLE_API_KEY! });
 *
 * // List locations
 * const locations = await stable.listLocations({ first: 10 });
 *
 * // Get recent mail for a location
 * const mail = await stable.listMailItems({
 *   locationId: locations.edges[0].node.id,
 *   first: 5,
 * });
 *
 * // Auto-paginate through all mail items
 * for await (const item of stable.paginate(stable.listMailItems, { first: 25 })) {
 *   console.log(item.id, item.from);
 * }
 * ```
 */
export class StableClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(options: StableClientOptions) {
    this.apiKey = options.apiKey;
    this.baseUrl = options.baseUrl ?? DEFAULT_BASE_URL;
  }

  private async request<T>(
    method: "GET" | "POST" | "DELETE",
    path: string,
    params?: Record<string, string>,
    body?: unknown,
  ): Promise<T> {
    const url = new URL(`${this.baseUrl}${path}`);
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        url.searchParams.set(key, value);
      }
    }

    const headers: Record<string, string> = {
      "x-api-key": this.apiKey,
    };
    if (body !== undefined) {
      headers["content-type"] = "application/json";
    }

    const res = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      const text = await res.text();
      throw new StableApiError(res.status, res.statusText, text);
    }

    return res.json() as Promise<T>;
  }

  /**
   * Convert a typed params object to a `Record<string, string>` for query params.
   * Drops `undefined` values and stringifies numbers.
   */
  private toQuery(params: object): Record<string, string> {
    const query: Record<string, string> = {};
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        query[key] = String(value);
      }
    }
    return query;
  }

  /**
   * List all locations associated with your account.
   *
   * Returns a paginated {@link Connection} of {@link Location} objects.
   * Use `first`/`after` for forward pagination, `last`/`before` for backward.
   *
   * @example
   * ```ts
   * const page = await stable.listLocations({ first: 10 });
   * for (const { node } of page.edges) {
   *   console.log(node.address.city, node.status);
   * }
   * ```
   */
  async listLocations(
    params: ListLocationsParams = {},
  ): Promise<Connection<Location>> {
    return this.request("GET", "/locations", this.toQuery(params));
  }

  /**
   * Retrieve a single location by ID.
   *
   * @param id - The location UUID.
   * @throws {StableApiError} With status `404` if the location doesn't exist.
   */
  async getLocation(id: string): Promise<Location> {
    return this.request("GET", `/locations/${id}`);
  }

  /**
   * Create a new virtual mailbox location.
   *
   * After creation the location will be in onboarding status `"authorize"`.
   * Complete the USPS Form 1583 flow before the location can receive mail.
   *
   * @example
   * ```ts
   * const location = await stable.createLocation({ locationCode: "SFO1" });
   * console.log(location.address); // The assigned address
   * console.log(location.onboarding.status); // "authorize"
   * ```
   */
  async createLocation(params: CreateLocationParams): Promise<Location> {
    return this.request("POST", "/locations", undefined, params);
  }

  /**
   * Deactivate a location. It will stop receiving new mail.
   *
   * @param id - The location UUID to deactivate.
   */
  async deactivateLocation(id: string): Promise<Location> {
    return this.request("POST", `/locations/${id}/deactivate`);
  }

  /**
   * List mail items, optionally filtered by location and date range.
   *
   * Supports cursor pagination and several filters including location,
   * creation date ranges, and scan status. See {@link ListMailItemsParams}.
   *
   * @example
   * ```ts
   * // Get the 20 most recent scanned items for a location
   * const mail = await stable.listMailItems({
   *   locationId: "loc_abc123",
   *   "scan.status": "completed",
   *   first: 20,
   * });
   * ```
   */
  async listMailItems(
    params: ListMailItemsParams = {},
  ): Promise<Connection<MailItem>> {
    return this.request("GET", "/mail-items", this.toQuery(params));
  }

  /**
   * Retrieve a single mail item by ID.
   *
   * Returns the full mail item including scan details, checks, tags,
   * forwarding/deposit status, and data extraction results.
   *
   * @param id - The mail item UUID.
   * @throws {StableApiError} With status `404` if the mail item doesn't exist.
   */
  async getMailItem(id: string): Promise<MailItem> {
    return this.request("GET", `/mail-items/${id}`);
  }

  /**
   * List all tags on your account.
   *
   * Tags are used to organize mail items. Unlike other list endpoints,
   * this returns a plain array (not a paginated connection).
   */
  async listTags(): Promise<Tag[]> {
    return this.request("GET", "/tags");
  }

  /**
   * Auto-paginate through a list endpoint, yielding each node.
   *
   * Wraps any list method that returns a {@link Connection} and handles
   * cursor advancement automatically. Set `first` in your params to
   * control page size.
   *
   * @param method - A bound list method (e.g. `stable.listMailItems`).
   * @param params - Query/filter params passed to every page request.
   *
   * @example
   * ```ts
   * // Iterate over every mail item in a location
   * const items = stable.paginate(stable.listMailItems, {
   *   locationId: "loc_abc123",
   *   first: 50,
   * });
   *
   * for await (const item of items) {
   *   console.log(item.id, item.from);
   * }
   * ```
   */
  async *paginate<T, P extends PaginationLike>(
    method: (params: P) => Promise<Connection<T>>,
    params: P,
  ): AsyncGenerator<T> {
    let cursor: string | undefined;

    while (true) {
      const page = await method.call(
        this,
        cursor ? { ...params, after: cursor } : params,
      );

      for (const edge of page.edges) {
        yield edge.node;
      }

      if (!page.pageInfo.hasNextPage) break;
      cursor = page.pageInfo.endCursor;
    }
  }
}

/** Minimum shape needed for a params object to work with {@link StableClient.paginate}. */
type PaginationLike = { first?: number; after?: string };
