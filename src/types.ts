/**
 * Stable API v1 — TypeScript type definitions.
 *
 * Derived from the Stable REST API OpenAPI specification.
 * https://docs.usestable.com
 *
 * @generated 2026-03-05
 */

/** Cursor-based pagination metadata returned with every list endpoint. */
export interface PageInfo {
  /** Opaque cursor pointing to the last item in the current page. */
  endCursor?: string;
  /** `true` when more items exist after {@link endCursor}. */
  hasNextPage: boolean;
  /** `true` when more items exist before {@link startCursor}. */
  hasPreviousPage: boolean;
  /** Opaque cursor pointing to the first item in the current page. */
  startCursor?: string;
}

/** A single edge in a paginated connection. */
export interface Edge<T> {
  /** Opaque cursor for this specific node — pass to `after` or `before`. */
  cursor: string;
  /** The resource at this position. */
  node: T;
}

/**
 * Relay-style cursor connection returned by all list endpoints.
 *
 * @example
 * ```ts
 * const page = await stable.listLocations({ first: 10 });
 * console.log(page.totalCount);
 * for (const edge of page.edges) {
 *   console.log(edge.node.id);
 * }
 * if (page.pageInfo.hasNextPage) {
 *   const next = await stable.listLocations({ first: 10, after: page.pageInfo.endCursor });
 * }
 * ```
 */
export interface Connection<T> {
  /** Ordered list of edges for the current page. */
  edges: Edge<T>[];
  /** Pagination cursors and has-more flags. */
  pageInfo: PageInfo;
  /** Total number of items across all pages. */
  totalCount: number;
}

/** Forward/backward pagination parameters shared by all list endpoints. */
export interface PaginationParams {
  /** Number of items to return from the front of the list. */
  first?: number;
  /** Return items after this cursor (pair with `first` for forward pagination). */
  after?: string;
  /** Number of items to return from the end of the list. */
  last?: number;
  /** Return items before this cursor (pair with `last` for backward pagination). */
  before?: string;
}

/** Available Stable facility codes for {@link CreateLocationParams.locationCode}. */
export type LocationCode =
  | "ATL2"
  | "BHM1"
  | "BNA1"
  | "BOS1"
  | "BWI1"
  | "CLT1"
  | "CMH1"
  | "CYS1"
  | "DCA1"
  | "DCA2"
  | "DEN1"
  | "DFW2"
  | "DTW1"
  | "EWR1"
  | "IAH1"
  | "ILG1"
  | "IND1"
  | "LAS1"
  | "LAX1"
  | "LGA1"
  | "MDW1"
  | "MIA1"
  | "PHL1"
  | "PHX1"
  | "SEA1"
  | "SFO1";

/** A physical mailing address. */
export interface Address {
  line1: string;
  line2: string;
  city: string;
  /** Two-letter US state code (e.g. `"CA"`, `"NY"`). */
  state: string;
  /** Five-digit ZIP code. */
  postalCode: string;
}

/** Progress through the USPS Form 1583 onboarding flow. */
export interface OnboardingStatus {
  /** Current step — a location must reach `"complete"` before receiving mail. */
  status: "authorize" | "sign" | "verify" | "complete";
}

/**
 * A virtual mailbox location registered with Stable.
 *
 * Each location corresponds to a physical CMRA (Commercial Mail Receiving Agency)
 * or registered agent facility. After creation, the location must complete USPS
 * Form 1583 onboarding before it can receive mail.
 */
export interface Location {
  /** Unique location identifier (UUID). */
  id: string;
  /** Whether this location is actively receiving mail. */
  status: "active" | "inactive";
  /** The physical street address for this mailbox. */
  address: Address;
  /** Facility type — `"cmra"` for standard mailboxes, `"registeredAgent"` for legal service. */
  type: "cmra" | "registeredAgent";
  /** Current USPS Form 1583 onboarding progress. */
  onboarding: OnboardingStatus;
  /** Arbitrary key-value metadata attached at creation time. */
  metadata: Record<string, unknown>;
}

/** Query filters for {@link StableClient.listLocations}. */
export interface ListLocationsParams extends PaginationParams {
  /** Filter to a specific location by ID. */
  id?: string;
}

/** Body for creating a new location. */
export interface CreateLocationParams {
  /** The Stable facility code to register at (e.g. `"SFO1"`, `"DCA1"`). */
  locationCode: LocationCode;
  /** Automatically scan the contents of incoming mail. Defaults to `false`. */
  autoScan?: boolean;
  /** Arbitrary metadata to attach to the location. */
  metadata?: Record<string, unknown>;
}

/** The addressed recipients printed on a piece of mail. */
export interface MailItemRecipients {
  /** First line of the recipient address as printed. */
  line1: { text: string };
  /** Second line of the recipient address, if present. */
  line2?: { text: string };
  /** Matched individual recipient from your account, if recognized. */
  individual?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  /** Matched business recipient from your account, if recognized. */
  business?: {
    id: string;
    name: string;
  };
}

/** Status of an async operation (scanning, forwarding, depositing). */
export type ActionStatus = "completed" | "processing";

/** Details about a mail item's content scan. */
export interface ScanDetails {
  /** URL to the scanned image of the mail contents. */
  imageUrl: string;
  /** Whether the scan has finished processing. */
  status: ActionStatus;
  /** URLs to OCR text extraction results, if available. */
  ocrResultUrls?: string[];
  /** AI-generated summary of the scanned content. */
  summary?: string;
}

/** Details about a physical mail forwarding request. */
export interface ForwardDetails {
  /** Carrier tracking number, if available. */
  trackingNumber: string;
  /** Forwarding cost in cents. */
  cost: number;
  /** Whether the forward has been completed. */
  status: ActionStatus;
}

/** Details about a check deposit request. */
export interface DepositDetails {
  /** Deposit tracking number, if available. */
  trackingNumber: string;
  /** Whether the deposit has been completed. */
  status: ActionStatus;
}

/** Details about a mail item being shredded. */
export interface ShredDetails {
  /** Whether the shred has been completed. */
  status: ActionStatus;
}

/**
 * A piece of physical mail received at one of your Stable locations.
 *
 * Mail items progress through a lifecycle: received → scanned → acted on
 * (forwarded, deposited, shredded, or archived). Use {@link ScanDetails}
 * to check whether content scanning is complete and to access images/OCR.
 */
export interface MailItem {
  /** Unique mail item identifier (UUID). */
  id: string;
  /** Sender name as printed on the envelope. */
  from: string;
  /** Addressed recipients parsed from the envelope. */
  recipients: MailItemRecipients;
  /** ISO 8601 timestamp — when Stable will auto-clear this item. */
  clearAt: string;
  /** URL to the envelope exterior image. */
  imageUrl: string;
  /** The location where this mail was received. */
  location: Location;
  /** Content scan status and results. */
  scanDetails: ScanDetails;
  /** Physical forwarding status, if requested. */
  forwardDetails: ForwardDetails;
  /** Check deposit status, if requested. */
  depositDetails: DepositDetails;
  /** Shred status, if requested. */
  shredDetails: ShredDetails;
  /** Checks detected inside this mail item. */
  checks: Check[];
  /** User-assigned tags. */
  tags: AssignedTag[];
  /** Teams this mail item is assigned to. */
  teams: Team[];
  /** Structured data extraction results from scanned content. */
  dataExtractionResults: DataExtractionResult[];
  /** ISO 8601 timestamp when this item was archived, if applicable. */
  archivedAt?: string;
  /** ISO 8601 timestamp when this item was marked as read, if applicable. */
  readAt?: string;
  /** Internal barcode identifier, if available. */
  barcodeId?: string;
}

/** Query filters for {@link StableClient.listMailItems}. */
export interface ListMailItemsParams extends PaginationParams {
  /** Filter to a specific mail item by ID. */
  id?: string;
  /** Filter to mail items at a specific location. */
  locationId?: string;
  /** Items created strictly after this ISO 8601 timestamp. */
  createdAt_gt?: string;
  /** Items created at or after this ISO 8601 timestamp. */
  createdAt_gte?: string;
  /** Items created strictly before this ISO 8601 timestamp. */
  createdAt_lt?: string;
  /** Items created at or before this ISO 8601 timestamp. */
  createdAt_lte?: string;
  /** Filter by scan status (`"completed"` or `"processing"`). */
  "scan.status"?: ActionStatus;
  /** Scans created strictly after this ISO 8601 timestamp. */
  "scan.createdAt_gt"?: string;
  /** Scans created at or after this ISO 8601 timestamp. */
  "scan.createdAt_gte"?: string;
  /** Scans created strictly before this ISO 8601 timestamp. */
  "scan.createdAt_lt"?: string;
  /** Scans created at or before this ISO 8601 timestamp. */
  "scan.createdAt_lte"?: string;
}

/** Current status of a check deposit. */
export type CheckStatus =
  | "notRequested"
  | "processing"
  | "completed"
  | "failed";

/** Timestamps marking when a check transitioned between statuses. */
export interface CheckStatusTransitions {
  /** When the deposit started processing. */
  processing?: string;
  /** When the deposit completed successfully. */
  completed?: string;
  /** When the deposit failed. */
  failed?: string;
}

/** Why a check deposit failed. */
export interface CheckFailureDetails {
  /** Human-readable failure description. */
  description: string;
  /** Machine-readable failure code. */
  code: string;
}

/**
 * A check detected inside a mail item.
 *
 * Checks are automatically transcribed when mail contents are scanned.
 * You can then request a deposit, which transitions the check through
 * `processing` → `completed` (or `failed`).
 */
export interface Check {
  /** Unique check identifier (UUID). */
  id: string;
  /** Check amount in the smallest currency unit (e.g. cents for USD). */
  amount: number;
  /** ISO 4217 currency code (e.g. `"usd"`). */
  currency: string;
  /** Check number printed on the check, if readable. */
  checkNumber?: string;
  /** ISO 8601 timestamp when the check was first detected. */
  createdAt: string;
  /** The mail item this check was found inside. */
  mailItemId: string;
  /** Name of the payer, if readable. */
  payer?: string;
  /** Name of the payee, if readable. */
  payee?: string;
  /** Current deposit status. */
  status: CheckStatus;
  /** Timestamps for each status transition. */
  statusTransitions: CheckStatusTransitions;
  /** Present when `status` is `"failed"` — explains what went wrong. */
  failureDetails?: CheckFailureDetails;
}

/** A tag that can be assigned to mail items for organization. */
export interface Tag {
  /** Unique tag identifier (UUID). */
  id: string;
  /** Display name of the tag. */
  name: string;
  /** ISO 8601 timestamp when the tag was created. */
  createdAt: string;
}

/** A tag that has been assigned to a specific mail item. */
export interface AssignedTag extends Tag {
  /** ISO 8601 timestamp when this tag was assigned to the mail item. */
  assignedAt: string;
}

/** A team that can be assigned to mail items. */
export interface Team {
  /** Unique team identifier (UUID). */
  id: string;
  /** Display name of the team. */
  name: string;
}

/** An extractor configuration used for structured data extraction. */
export interface Extractor {
  /** Unique extractor identifier. */
  id: string;
  /** Display name of the extractor. */
  name: string;
}

/** Result of running a data extractor on scanned mail content. */
export interface DataExtractionResult {
  /** Unique result identifier (UUID). */
  id: string;
  /** The extractor that produced this result. */
  extractor: Extractor;
  /** Current status of the extraction. */
  status: "pending" | "succeeded" | "failed" | "deleted";
  /** ISO 8601 timestamp if extraction succeeded. */
  succeededAt?: string | null;
  /** ISO 8601 timestamp if extraction failed. */
  failedAt?: string | null;
  /** ISO 8601 timestamp if result was deleted. */
  deletedAt?: string | null;
  /** The extracted key-value data, empty array if none. */
  extractedData: unknown[];
}

/** Error response body returned by the Stable API on failure. */
export interface ApiErrorBody {
  message: string;
  statusCode: number;
}
