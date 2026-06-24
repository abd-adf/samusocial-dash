"use client";

import { Eye, Users, Radio, MousePointer, Repeat, BarChart3 } from "lucide-react";
import type { QueryRow } from "@/lib/api";
import { formatNumber, formatPercent } from "@/lib/format";

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
    </div>
  );
}
