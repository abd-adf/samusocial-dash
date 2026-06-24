import Header from "@/components/Header";
import Dashboard from "@/components/Dashboard";
import { queryFacebookAds, queryGA4, queryGoogleAds } from "@/lib/api";

export const revalidate = 300;

const DATE_FROM = "2025-11-01";
const DATE_TO = "2025-12-31";

export default async function Home() {
  const [fbMonthly, fbCampaigns, ga4Monthly, gadsCampaigns] = await Promise.all([
    queryFacebookAds(
      DATE_FROM,
      DATE_TO,
      ["month", "spend", "impressions", "clicks", "ctr", "cpc"],
      ["month"],
    ),
    queryFacebookAds(
      DATE_FROM,
      DATE_TO,
      ["campaign_name", "spend", "impressions", "clicks", "ctr", "cpc"],
      ["campaign_name"],
    ),
    queryGA4(
      DATE_FROM,
      DATE_TO,
      ["month", "sessions", "activeUsers", "screenPageViews", "bounceRate", "averageSessionDuration", "newUsers"],
      ["month"],
    ),
    queryGoogleAds(
      "google_ads_paid",
      DATE_FROM,
      DATE_TO,
      ["campaign.name", "metrics.cost_micros", "metrics.impressions", "metrics.clicks", "metrics.ctr", "metrics.average_cpc", "metrics.conversions"],
      ["campaign.name"],
    ),
  ]);

  const lastUpdated = new Date().toLocaleDateString("fr-BE", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <>
      <Header />
      <main className="flex-1">
        <Dashboard
          fbMonthly={fbMonthly.rows}
          fbCampaigns={fbCampaigns.rows}
          ga4Monthly={ga4Monthly.rows}
          gadsCampaigns={gadsCampaigns.rows}
          lastUpdated={lastUpdated}
          dateRange={{ start: DATE_FROM, end: DATE_TO }}
        />
      </main>
      <footer className="border-t border-border py-4 text-center text-xs text-text-muted">
        New Samusocial ASBL &mdash; Dashboard de reporting digital
      </footer>
    </>
  );
}
