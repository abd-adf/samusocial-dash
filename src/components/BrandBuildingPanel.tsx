"use client";

import { Eye, Users, Radio, MousePointer, Repeat, BarChart3 } from "lucide-react";
import type { QueryRow } from "@/lib/api";
import { formatNumber, formatPercent } from "@/lib/format";
import Image from "next/image";

interface BrandBuildingPanelProps {
  fbData: QueryRow[];
  gadsData: QueryRow[];
  ga4Data: QueryRow[];
}

export default function BrandBuildingPanel({ fbData, gadsData, ga4Data }: BrandBuildingPanelProps) {
  // Meta: reach, impressions, frequency, CTR
  const metaImpressions = fbData.reduce((s, r) => s + (Number(r.impressions) || 0), 0);
  const metaReach = fbData.reduce((s, r) => s + (Number(r.reach) || 0), 0);
  const metaClicks = fbData.reduce((s, r) => s + (Number(r.clicks) || 0), 0);
  const metaFrequency = metaReach > 0 ? metaImpressions / metaReach : 0;
  const metaCTR = metaImpressions > 0 ? (metaClicks / metaImpressions) * 100 : 0;

  // Google: impressions, clicks, CTR, top impression %
  const gadsImpressions = gadsData.reduce((s, r) => s + (Number(r["metrics.impressions"]) || 0), 0);
  const gadsClicks = gadsData.reduce((s, r) => s + (Number(r["metrics.clicks"]) || 0), 0);
  const gadsCTR = gadsImpressions > 0 ? (gadsClicks / gadsImpressions) * 100 : 0;

  // GA4: sessions, users, new users
  const ga4Sessions = ga4Data.reduce((s, r) => s + (Number(r.sessions) || 0), 0);
  const ga4Users = ga4Data.reduce((s, r) => s + (Number(r.activeUsers) || 0), 0);
  const ga4NewUsers = ga4Data.reduce((s, r) => s + (Number(r.newUsers) || 0), 0);

  // Total reach/impressions
  const totalImpressions = metaImpressions + gadsImpressions;
  const totalClicks = metaClicks + gadsClicks;
  const overallCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;

  // Byron Sharp: Mental Availability = Reach + Frequency
  // Physical Availability = Landing page / site visits
  const kpis = [
    {
      label: "Impressions totales",
      value: formatNumber(totalImpressions),
      sub: `Meta ${formatNumber(metaImpressions)} · Google ${formatNumber(gadsImpressions)}`,
      icon: Eye,
      color: "text-[#8b5cf6]",
      bg: "bg-[#8b5cf6]/10",
    },
    {
      label: "Portée (Reach)",
      value: formatNumber(metaReach),
      sub: "Personnes uniques atteintes (Meta)",
      icon: Users,
      color: "text-[#1877F2]",
      bg: "bg-[#1877F2]/10",
    },
    {
      label: "Fréquence moyenne",
      value: metaFrequency.toFixed(1),
      sub: "Expositions par personne (Meta)",
      icon: Repeat,
      color: "text-accent",
      bg: "bg-accent/10",
    },
    {
      label: "CTR global",
      value: formatPercent(overallCTR),
      sub: `Meta ${formatPercent(metaCTR)} · Google ${formatPercent(gadsCTR)}`,
      icon: MousePointer,
      color: "text-success",
      bg: "bg-success/10",
    },
    {
      label: "Visites site (GA4)",
      value: formatNumber(ga4Sessions),
      sub: `${formatNumber(ga4Users)} utilisateurs actifs`,
      icon: BarChart3,
      color: "text-[#E37400]",
      bg: "bg-[#E37400]/10",
    },
    {
      label: "Nouveaux visiteurs",
      value: formatNumber(ga4NewUsers),
      sub: ga4Users > 0 ? `${((ga4NewUsers / ga4Users) * 100).toFixed(0)} % de l'audience` : "—",
      icon: Radio,
      color: "text-primary",
      bg: "bg-primary/10",
    },
  ];

  // Per-campaign Meta data for table
  const metaCampaigns = fbData.map((r) => {
    const impressions = Number(r.impressions) || 0;
    const reach = Number(r.reach) || 0;
    const clicks = Number(r.clicks) || 0;
    return {
      name: String(r.campaign_name),
      impressions,
      reach,
      frequency: reach > 0 ? impressions / reach : 0,
      ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
    };
  });

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="bg-surface rounded-xl border border-border p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-medium text-text-muted uppercase tracking-wide">
                {kpi.label}
              </span>
              <div className={`${kpi.bg} ${kpi.color} p-2 rounded-lg`}>
                <kpi.icon className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
            <p className="text-xs text-text-muted mt-1">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* Platform breakdown */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Meta Brand */}
        <div className="bg-surface rounded-xl border border-border p-6">
          <div className="flex items-center gap-3 mb-4">
            <Image src="/logos/meta.png" alt="Meta" width={80} height={24} className="h-5 w-auto" />
            <span className="text-xs text-text-muted">Brand Metrics</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Impressions", value: formatNumber(metaImpressions) },
              { label: "Reach", value: formatNumber(metaReach) },
              { label: "Fréquence", value: metaFrequency.toFixed(2) },
              { label: "CTR", value: formatPercent(metaCTR) },
            ].map((m) => (
              <div key={m.label} className="bg-background rounded-lg p-3">
                <p className="text-[10px] uppercase tracking-wide text-text-muted">{m.label}</p>
                <p className="text-lg font-bold text-foreground">{m.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Google Brand */}
        <div className="bg-surface rounded-xl border border-border p-6">
          <div className="flex items-center gap-3 mb-4">
            <Image src="/logos/google-ads.png" alt="Google Ads" width={100} height={28} className="h-6 w-auto bg-white rounded px-1" />
            <span className="text-xs text-text-muted">Brand Metrics</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {gadsData.map((row) => (
              <div key={String(row["campaign.name"])} className="bg-background rounded-lg p-3">
                <p className="text-[10px] uppercase tracking-wide text-text-muted truncate">
                  {String(row["campaign.name"])}
                </p>
                <p className="text-lg font-bold text-foreground">
                  {formatNumber(Number(row["metrics.impressions"]))}
                </p>
                <p className="text-[10px] text-text-muted">
                  CTR {formatPercent(Number(row["metrics.ctr"]))}
                  {Number(row["metrics.top_impression_percentage"]) > 0 &&
                    ` · Top ${formatPercent(Number(row["metrics.top_impression_percentage"]))}`}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Reach vs Impressions per campaign table */}
      {metaCampaigns.length > 0 && (
        <div className="bg-surface rounded-xl border border-border overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center gap-3">
            <Image src="/logos/meta.png" alt="Meta" width={80} height={24} className="h-5 w-auto" />
            <div>
              <h3 className="text-sm font-semibold text-foreground">Reach & Fréquence par campagne</h3>
              <p className="text-xs text-text-muted">Byron Sharp : maximiser la portée avec une fréquence suffisante</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-background/50">
                  <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-text-muted uppercase tracking-wide">Campagne</th>
                  <th className="px-4 py-2.5 text-right text-[11px] font-semibold text-text-muted uppercase tracking-wide">Impressions</th>
                  <th className="px-4 py-2.5 text-right text-[11px] font-semibold text-text-muted uppercase tracking-wide">Reach</th>
                  <th className="px-4 py-2.5 text-right text-[11px] font-semibold text-text-muted uppercase tracking-wide">Fréquence</th>
                  <th className="px-4 py-2.5 text-right text-[11px] font-semibold text-text-muted uppercase tracking-wide">CTR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {metaCampaigns.map((c) => (
                  <tr key={c.name} className="hover:bg-surface-hover transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground max-w-[300px] truncate">{c.name}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-text-muted">{formatNumber(c.impressions)}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-text-muted">{formatNumber(c.reach)}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-text-muted">{c.frequency.toFixed(1)}×</td>
                    <td className="px-4 py-3 text-right tabular-nums text-text-muted">{formatPercent(c.ctr)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
