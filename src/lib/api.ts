const API_URL = process.env.REPORTING_NINJA_API_URL || "https://api.reportingninja.com/v1";
const API_KEY = process.env.REPORTING_NINJA_API_KEY || "";

interface ApiResponse<T> {
  status: "ok" | "error";
  data: T;
  error_code?: string;
  message?: string;
  meta: {
    request_id: string;
    timestamp: string;
    total_rows?: number;
    returned_rows?: number;
    has_more?: boolean;
    date_range_resolved?: { start: string; end: string };
  };
}

async function apiPost<T>(endpoint: string, body: Record<string, unknown> = {}): Promise<ApiResponse<T>> {
  const res = await fetch(`${API_URL}${endpoint}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    next: { revalidate: 300 },
  });

  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

// ── Samusocial account config ────────────────────────────────────────────────

export const SAMUSOCIAL_ACCOUNTS = {
  facebook_ads: {
    connection_key: "lmr.infocom@gmail.com",
    account_id: "254104171724853",
    label: "Meta Ads",
    settings: {
      attribution_window:
        "ATTRIBUTION_MODEL_VIEW_CLICK###VIEW_ATTRIBUTION_WINDOW_1D###CLICK_ATTRIBUTION_WINDOW_7D",
    },
  },
  ga4: {
    connection_key: "abourdil@adfinitas.be",
    account_id: "properties/371297123",
    label: "Google Analytics 4",
  },
  google_ads_paid: {
    connection_key: "abourdil@adfinitas.be",
    account_id: "6661384976",
    label: "Google Ads (Paid)",
    data_view: "campaign",
  },
  google_ads_grants: {
    connection_key: "abourdil@adfinitas.be",
    account_id: "3625485970",
    label: "Google Ads (Grants)",
    data_view: "campaign",
  },
} as const;

// ── Query types ──────────────────────────────────────────────────────────────

export interface QueryRow {
  [key: string]: string | number;
}

export interface QueryResult {
  rows: QueryRow[];
  meta: ApiResponse<unknown>["meta"];
}

// ── Data fetching functions ──────────────────────────────────────────────────

export async function queryFacebookAds(
  dateFrom: string,
  dateTo: string,
  fields: string[],
  groupBy: string[],
  limit = 100,
): Promise<QueryResult> {
  const cfg = SAMUSOCIAL_ACCOUNTS.facebook_ads;
  const res = await apiPost<{ rows: QueryRow[] }>("/query", {
    integration_id: "facebook_ads",
    connection_key: cfg.connection_key,
    account_id: cfg.account_id,
    date_range: { preset: "custom", start: dateFrom, end: dateTo },
    fields,
    group_by: groupBy,
    settings: cfg.settings,
    limit,
  });
  return { rows: res.data.rows, meta: res.meta };
}

export async function queryGA4(
  dateFrom: string,
  dateTo: string,
  fields: string[],
  groupBy: string[],
  limit = 100,
): Promise<QueryResult> {
  const cfg = SAMUSOCIAL_ACCOUNTS.ga4;
  const res = await apiPost<{ rows: QueryRow[] }>("/query", {
    integration_id: "ga4",
    connection_key: cfg.connection_key,
    account_id: cfg.account_id,
    date_range: { preset: "custom", start: dateFrom, end: dateTo },
    fields,
    group_by: groupBy,
    limit,
  });
  return { rows: res.data.rows, meta: res.meta };
}

export async function queryGoogleAds(
  accountKey: "google_ads_paid" | "google_ads_grants",
  dateFrom: string,
  dateTo: string,
  fields: string[],
  groupBy: string[],
  limit = 100,
): Promise<QueryResult> {
  const cfg = SAMUSOCIAL_ACCOUNTS[accountKey];
  const res = await apiPost<{ rows: QueryRow[] }>("/query", {
    integration_id: "google_ads",
    connection_key: cfg.connection_key,
    account_id: cfg.account_id,
    data_view: cfg.data_view,
    date_range: { preset: "custom", start: dateFrom, end: dateTo },
    fields,
    group_by: groupBy,
    limit,
  });
  return { rows: res.data.rows, meta: res.meta };
}

export { apiPost };
