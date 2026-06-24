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

async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function apiPost<T>(endpoint: string, body: Record<string, unknown> = {}): Promise<ApiResponse<T>> {
  const maxRetries = 3;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      if (attempt > 0) await delay(1000 * attempt);
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        next: { revalidate: 300 },
      });

      if (res.status === 429) {
        const retryAfter = Number(res.headers.get("Retry-After") || 2);
        await delay(retryAfter * 1000);
        continue;
      }

      if (!res.ok) {
        throw new Error(`API error: ${res.status} ${res.statusText}`);
      }

      return res.json();
    } catch (err) {
      if (attempt === maxRetries - 1) throw err;
    }
  }
  throw new Error("Max retries exceeded");
}

// ── Types ────────────────────────────────────────────────────────────────────

export interface QueryRow {
  [key: string]: string | number;
}

export interface QueryResult {
  rows: QueryRow[];
}

// ── Samusocial accounts ──────────────────────────────────────────────────────

export const SAMUSOCIAL = {
  facebook_ads: {
    integration_id: "facebook_ads",
    connection_key: "lmr.infocom@gmail.com",
    account_id: "254104171724853",
    settings: {
      attribution_window:
        "ATTRIBUTION_MODEL_VIEW_CLICK###VIEW_ATTRIBUTION_WINDOW_1D###CLICK_ATTRIBUTION_WINDOW_7D",
    },
  },
  ga4: {
    integration_id: "ga4",
    connection_key: "abourdil@adfinitas.be",
    account_id: "properties/371297123",
  },
  google_ads_paid: {
    integration_id: "google_ads",
    connection_key: "abourdil@adfinitas.be",
    account_id: "6661384976",
    data_view: "campaign",
  },
  mailchimp: {
    integration_id: "mailchimp",
    connection_key: "New Samusocial asbl",
    account_id: "ALL_CAMPAIGNS_SENT_IN_DATE_RANGE",
    data_view: "campaign_overview",
    settings: { entity: "campaign" },
  },
} as const;

// ── Query helpers ────────────────────────────────────────────────────────────

export async function queryFacebookAds(
  dateFrom: string,
  dateTo: string,
  fields: string[],
  groupBy: string[],
): Promise<QueryResult> {
  const cfg = SAMUSOCIAL.facebook_ads;
  const res = await apiPost<{ rows: QueryRow[] }>("/query", {
    integration_id: cfg.integration_id,
    connection_key: cfg.connection_key,
    account_id: cfg.account_id,
    date_range: { preset: "custom", start: dateFrom, end: dateTo },
    fields,
    group_by: groupBy,
    settings: cfg.settings,
    limit: 200,
  });
  return { rows: res.data.rows };
}

export async function queryGA4(
  dateFrom: string,
  dateTo: string,
  fields: string[],
  groupBy: string[],
): Promise<QueryResult> {
  const cfg = SAMUSOCIAL.ga4;
  const res = await apiPost<{ rows: QueryRow[] }>("/query", {
    integration_id: cfg.integration_id,
    connection_key: cfg.connection_key,
    account_id: cfg.account_id,
    date_range: { preset: "custom", start: dateFrom, end: dateTo },
    fields,
    group_by: groupBy,
    limit: 200,
  });
  return { rows: res.data.rows };
}

export async function queryGoogleAds(
  dateFrom: string,
  dateTo: string,
  fields: string[],
  groupBy: string[],
): Promise<QueryResult> {
  const cfg = SAMUSOCIAL.google_ads_paid;
  const res = await apiPost<{ rows: QueryRow[] }>("/query", {
    integration_id: cfg.integration_id,
    connection_key: cfg.connection_key,
    account_id: cfg.account_id,
    data_view: cfg.data_view,
    date_range: { preset: "custom", start: dateFrom, end: dateTo },
    fields,
    group_by: groupBy,
    limit: 200,
  });
  return { rows: res.data.rows };
}

export async function queryMailchimp(
  dateFrom: string,
  dateTo: string,
  fields: string[],
  groupBy: string[],
): Promise<QueryResult> {
  const cfg = SAMUSOCIAL.mailchimp;
  const res = await apiPost<{ rows: QueryRow[] }>("/query", {
    integration_id: cfg.integration_id,
    connection_key: cfg.connection_key,
    account_id: cfg.account_id,
    data_view: cfg.data_view,
    settings: cfg.settings,
    date_range: { preset: "custom", start: dateFrom, end: dateTo },
    fields,
    group_by: groupBy,
    limit: 200,
  });
  return { rows: res.data.rows };
}
