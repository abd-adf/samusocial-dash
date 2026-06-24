import Header from "@/components/Header";
import Dashboard from "@/components/Dashboard";
import {
  queryFacebookAds,
  queryGA4,
  queryGoogleAds,
  queryMailchimp,
} from "@/lib/api";

export const revalidate = 300;

const DATE_FROM = "2025-11-01";
const DATE_TO = "2025-12-31";

const FB_FIELDS_BASE = [
  "spend", "impressions", "clicks", "ctr", "cpc",
  "actions:link_click", "cost_per_action_type:link_click",
  "actions:landing_page_view",
];

export default async function Home() {
  // Stagger requests to avoid socket exhaustion
  const [fbMonthly, fbCampaigns] = await Promise.all([
    queryFacebookAds(DATE_FROM, DATE_TO, ["month", ...FB_FIELDS_BASE], ["month"]),
    queryFacebookAds(DATE_FROM, DATE_TO, ["campaign_name", ...FB_FIELDS_BASE], ["campaign_name"]),
  ]);

  const [ga4Monthly, gadsCampaigns] = await Promise.all([
    queryGA4(
      DATE_FROM, DATE_TO,
      ["month", "sessions", "activeUsers", "newUsers", "screenPageViews", "bounceRate", "averageSessionDuration", "conversions"],
      ["month"],
    ),
    queryGoogleAds(
      DATE_FROM, DATE_TO,
      ["campaign.name", "metrics.cost_micros", "metrics.impressions", "metrics.clicks", "metrics.ctr", "metrics.average_cpc", "metrics.conversions", "metrics.conversions_value"],
      ["campaign.name"],
    ),
  ]);

  const mailchimpCampaigns = await queryMailchimp(
    DATE_FROM, DATE_TO,
    ["campaignName", "sendTime", "emailsSent", "opens", "uniqueOpens", "openRate", "clicks", "uniqueClicks", "clickRate", "bounces", "unsubscribed"],
    ["campaignName"],
  );

  const initialData = {
    fbMonthly: fbMonthly.rows,
    fbCampaigns: fbCampaigns.rows,
    ga4Monthly: ga4Monthly.rows,
    gadsCampaigns: gadsCampaigns.rows,
    mailchimpCampaigns: mailchimpCampaigns.rows,
    dateRange: { start: DATE_FROM, end: DATE_TO },
  };

  return (
    <>
      <Header />
      <main className="flex-1">
        <Dashboard initialData={initialData} />
      </main>
      <footer className="border-t border-border py-4 text-center text-xs text-text-muted">
        New Samusocial ASBL &mdash; Dashboard de reporting digital
      </footer>
    </>
  );
}
