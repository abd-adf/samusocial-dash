import Header from "@/components/Header";
import Dashboard from "@/components/Dashboard";
import type { DashboardData } from "@/components/Dashboard";
import { queryFacebookAds, queryGA4, queryGoogleAds, queryMailchimp } from "@/lib/api";

export const revalidate = 300;

const DATE_FROM = "2025-11-01";
const DATE_TO = "2025-12-31";

const FB_CAMPAIGN_FIELDS = [
  "campaign_name", "spend", "impressions", "clicks", "ctr", "cpc",
  "reach", "frequency",
  "actions:link_click", "cost_per_action_type:link_click",
  "actions:landing_page_view",
  "actions:omni_purchase", "action_values:omni_purchase",
  "cost_per_action_type:omni_purchase", "purchase_roas:omni_purchase",
];

const FB_MONTHLY_FIELDS = [
  "month", "spend", "impressions", "clicks", "ctr", "cpc",
  "reach", "frequency",
  "actions:link_click", "cost_per_action_type:link_click",
  "actions:landing_page_view",
  "actions:omni_purchase", "action_values:omni_purchase",
];

const GADS_FIELDS = [
  "campaign.name", "metrics.cost_micros", "metrics.impressions",
  "metrics.clicks", "metrics.ctr", "metrics.average_cpc",
  "metrics.conversions", "metrics.conversions_value",
  "metrics.absolute_top_impression_percentage",
  "metrics.top_impression_percentage",
];

export default async function Home() {
  // Batch 1: Facebook Ads
  const [fbMonthly, fbCampaigns] = await Promise.all([
    queryFacebookAds(DATE_FROM, DATE_TO, FB_MONTHLY_FIELDS, ["month"]),
    queryFacebookAds(DATE_FROM, DATE_TO, FB_CAMPAIGN_FIELDS, ["campaign_name"]),
  ]);

  // Batch 2: GA4 + Google Ads
  const [ga4Monthly, gadsCampaigns] = await Promise.all([
    queryGA4(
      DATE_FROM, DATE_TO,
      ["month", "sessions", "activeUsers", "newUsers", "screenPageViews", "bounceRate", "averageSessionDuration", "conversions"],
      ["month"],
    ),
    queryGoogleAds(DATE_FROM, DATE_TO, GADS_FIELDS, ["campaign.name"]),
  ]);

  // Batch 3: Donations + Mailchimp
  const [donationsByCategory, donationsMonthly, donationsMonthlyByCategory, donationsByChannel, mailchimpCampaigns] =
    await Promise.all([
      queryGA4(DATE_FROM, DATE_TO, ["itemCategory", "itemRevenue", "itemsPurchased"], ["itemCategory"]),
      queryGA4(DATE_FROM, DATE_TO, ["month", "totalRevenue", "ecommercePurchases", "transactions", "purchaseRevenue", "averagePurchaseRevenue"], ["month"]),
      queryGA4(DATE_FROM, DATE_TO, ["month", "itemCategory", "itemRevenue", "itemsPurchased"], ["month", "itemCategory"]),
      queryGA4(DATE_FROM, DATE_TO, ["sessionManualSource", "sessionManualMedium", "sessionManualCampaignName", "transactions", "purchaseRevenue"], ["sessionManualSource", "sessionManualMedium", "sessionManualCampaignName"]),
      queryMailchimp(
        DATE_FROM, DATE_TO,
        ["campaignName", "sendTime", "emailsSent", "opens", "uniqueOpens", "openRate", "clicks", "uniqueClicks", "clickRate", "bounces", "unsubscribed"],
        ["campaignName"],
      ),
    ]);

  const initialData: DashboardData = {
    fbMonthly: fbMonthly.rows,
    fbCampaigns: fbCampaigns.rows,
    ga4Monthly: ga4Monthly.rows,
    gadsCampaigns: gadsCampaigns.rows,
    donationsByCategory: donationsByCategory.rows,
    donationsMonthly: donationsMonthly.rows,
    donationsMonthlyByCategory: donationsMonthlyByCategory.rows,
    donationsByChannel: donationsByChannel.rows,
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
