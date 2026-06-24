"use client";

import type { QueryRow } from "@/lib/api";
import StatsCards from "./StatsCards";
import MonthlyChart from "./MonthlyChart";
import SpendChart from "./SpendChart";
import CampaignTable from "./CampaignTable";

interface DashboardProps {
  fbMonthly: QueryRow[];
  fbCampaigns: QueryRow[];
  ga4Monthly: QueryRow[];
  gadsCampaigns: QueryRow[];
  lastUpdated: string;
  dateRange: { start: string; end: string };
}

export default function Dashboard({
  fbMonthly,
  fbCampaigns,
  ga4Monthly,
  gadsCampaigns,
  lastUpdated,
  dateRange,
}: DashboardProps) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">
            Samusocial Brussels — Vue d&apos;ensemble
          </h2>
          <p className="text-xs text-text-muted">
            Période : {dateRange.start} au {dateRange.end}
          </p>
        </div>
        <span className="text-[11px] text-text-muted">
          Mis à jour le {lastUpdated}
        </span>
      </div>

      {/* KPI Cards */}
      <StatsCards
        fbData={fbMonthly}
        ga4Data={ga4Monthly}
        gadsData={gadsCampaigns}
      />

      {/* Charts row */}
      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <MonthlyChart fbMonthly={fbMonthly} ga4Monthly={ga4Monthly} />
        </div>
        <div className="lg:col-span-2">
          <SpendChart fbData={fbMonthly} gadsData={gadsCampaigns} />
        </div>
      </div>

      {/* Campaign tables */}
      <div className="grid lg:grid-cols-2 gap-6">
        <CampaignTable
          title="Campagnes Meta Ads"
          platform="Facebook & Instagram"
          color="#1877F2"
          rows={fbCampaigns}
          columns={[
            { key: "campaign_name", label: "Campagne", format: "text" },
            { key: "spend", label: "Dépenses", format: "currency" },
            { key: "impressions", label: "Impressions", format: "number" },
            { key: "clicks", label: "Clics", format: "number" },
            { key: "ctr", label: "CTR", format: "percent" },
            { key: "cpc", label: "CPC", format: "currency" },
          ]}
        />
        <CampaignTable
          title="Campagnes Google Ads"
          platform="Search & Performance Max"
          color="#4285F4"
          rows={gadsCampaigns}
          columns={[
            { key: "campaign.name", label: "Campagne", format: "text" },
            { key: "metrics.cost_micros", label: "Dépenses", format: "currency" },
            { key: "metrics.impressions", label: "Impressions", format: "number" },
            { key: "metrics.clicks", label: "Clics", format: "number" },
            { key: "metrics.ctr", label: "CTR", format: "percent" },
            { key: "metrics.conversions", label: "Conv.", format: "number" },
          ]}
        />
      </div>
    </div>
  );
}
