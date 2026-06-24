"use client";

import { Heart, TrendingUp, Repeat, Banknote } from "lucide-react";
import {
  ComposedChart,
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  Cell,
} from "recharts";
import type { QueryRow } from "@/lib/api";
import { formatCurrency, formatNumber } from "@/lib/format";

interface DonationsPanelProps {
  byCategory: QueryRow[];
  monthlyTotals: QueryRow[];
  monthlyByCategory: QueryRow[];
  byChannel: QueryRow[];
}

export default function DonationsPanel({
  byCategory,
  monthlyTotals,
  monthlyByCategory,
  byChannel,
}: DonationsPanelProps) {
  const once = byCategory.find((r) => r.itemCategory === "once");
  const regular = byCategory.find((r) => r.itemCategory === "regular");

  const totalRevenue =
    (Number(once?.itemRevenue) || 0) + (Number(regular?.itemRevenue) || 0);
  const totalDonations =
    (Number(once?.itemsPurchased) || 0) + (Number(regular?.itemsPurchased) || 0);
  const avgDonation = totalDonations > 0 ? totalRevenue / totalDonations : 0;

  const onceRevenue = Number(once?.itemRevenue) || 0;
  const onceCount = Number(once?.itemsPurchased) || 0;
  const regularRevenue = Number(regular?.itemRevenue) || 0;
  const regularCount = Number(regular?.itemsPurchased) || 0;

  // Build monthly chart data
  const monthNames: Record<string, string> = {
    "01": "Jan", "02": "Fév", "03": "Mar", "04": "Avr",
    "05": "Mai", "06": "Juin", "07": "Juil", "08": "Août",
    "09": "Sep", "10": "Oct", "11": "Nov", "12": "Déc",
    "2025-01": "Jan 25", "2025-02": "Fév 25", "2025-03": "Mar 25",
    "2025-04": "Avr 25", "2025-05": "Mai 25", "2025-06": "Juin 25",
    "2025-07": "Juil 25", "2025-08": "Août 25", "2025-09": "Sep 25",
    "2025-10": "Oct 25", "2025-11": "Nov 25", "2025-12": "Déc 25",
  };

  const months = new Set<string>();
  monthlyByCategory.forEach((r) => months.add(String(r.month)));

  const chartData = Array.from(months)
    .sort()
    .map((month) => {
      const onceRow = monthlyByCategory.find(
        (r) => String(r.month) === month && r.itemCategory === "once"
      );
      const regularRow = monthlyByCategory.find(
        (r) => String(r.month) === month && r.itemCategory === "regular"
      );
      const totalRow = monthlyTotals.find((r) => String(r.month) === month);
      const onceCount = Number(onceRow?.itemsPurchased) || 0;
      const regCount = Number(regularRow?.itemsPurchased) || 0;
      return {
        month: monthNames[month] || month,
        "Dons uniques (€)": Math.round(Number(onceRow?.itemRevenue) || 0),
        "Dons réguliers (€)": Math.round(Number(regularRow?.itemRevenue) || 0),
        "Nombre de dons": onceCount + regCount,
      };
    });

  // Channel attribution — group source/medium into meaningful channels
  const channelConfig: Record<string, { label: string; color: string }> = {
    "Meta Ads": { label: "Meta Ads", color: "#1877F2" },
    "Google Ads": { label: "Google Ads", color: "#4285F4" },
    "Email": { label: "Email", color: "#8b5cf6" },
    "Organic / Popup": { label: "Organic / Popup", color: "#6b7280" },
    "Direct": { label: "Direct", color: "#21365e" },
    "Referral": { label: "Referral", color: "#f04f26" },
    "Organic Search": { label: "Organic Search", color: "#10b981" },
    "Organic Social": { label: "Organic Social", color: "#E37400" },
    "Autre": { label: "Autre", color: "#94a3b8" },
  };

  function classifyChannel(source: string, medium: string): string {
    const s = source.toLowerCase();
    const m = medium.toLowerCase();
    if (s === "meta" && m === "ads") return "Meta Ads";
    if ((s === "paid" || s === "ads") && m === "google") return "Google Ads";
    if (m === "email") return "Email";
    if (s === "organic" && m === "popup") return "Organic / Popup";
    if (s === "(not set)" && m === "(not set)") return "Direct";
    if (m === "referral") return "Referral";
    if (m === "organic") return "Organic Search";
    if (m === "social" || s === "l.instagram.com" || s === "l.facebook.com") return "Organic Social";
    if (s === "paid" && m === "lp") return "Google Ads";
    return "Autre";
  }

  const channelAgg: Record<string, { revenue: number; transactions: number }> = {};
  byChannel.forEach((r) => {
    const tx = Number(r.transactions) || 0;
    if (tx === 0) return;
    const ch = classifyChannel(String(r.sessionManualSource || ""), String(r.sessionManualMedium || ""));
    if (!channelAgg[ch]) channelAgg[ch] = { revenue: 0, transactions: 0 };
    channelAgg[ch].revenue += Number(r.purchaseRevenue) || 0;
    channelAgg[ch].transactions += tx;
  });

  const channelData = Object.entries(channelAgg)
    .map(([ch, data]) => ({
      channel: channelConfig[ch]?.label || ch,
      revenue: Math.round(data.revenue),
      transactions: data.transactions,
      color: channelConfig[ch]?.color || "#94a3b8",
    }))
    .sort((a, b) => b.revenue - a.revenue);

  const kpis = [
    {
      label: "Revenu total",
      value: formatCurrency(totalRevenue),
      sub: `${formatNumber(totalDonations)} dons`,
      icon: Banknote,
      color: "text-success",
      bg: "bg-success/10",
      highlight: true,
    },
    {
      label: "Don moyen",
      value: formatCurrency(avgDonation),
      sub: "Tous types confondus",
      icon: TrendingUp,
      color: "text-primary",
      bg: "bg-primary/10",
      highlight: false,
    },
    {
      label: "Dons uniques",
      value: formatCurrency(onceRevenue),
      sub: `${formatNumber(onceCount)} dons · moy. ${formatCurrency(onceCount > 0 ? onceRevenue / onceCount : 0)}`,
      icon: Heart,
      color: "text-accent",
      bg: "bg-accent/10",
      highlight: false,
    },
    {
      label: "Dons réguliers",
      value: formatCurrency(regularRevenue),
      sub: `${formatNumber(regularCount)} dons · moy. ${formatCurrency(regularCount > 0 ? regularRevenue / regularCount : 0)}`,
      icon: Repeat,
      color: "text-[#8b5cf6]",
      bg: "bg-[#8b5cf6]/10",
      highlight: false,
    },
  ];

  return (
    <div className="space-y-4">
      {/* Donation KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className={`rounded-xl border p-5 hover:shadow-md transition-shadow ${
              kpi.highlight
                ? "bg-success/5 border-success/20"
                : "bg-surface border-border"
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-medium text-text-muted uppercase tracking-wide">
                {kpi.label}
              </span>
              <div className={`${kpi.bg} ${kpi.color} p-2 rounded-lg`}>
                <kpi.icon className="w-4 h-4" />
              </div>
            </div>
            <p className={`text-2xl font-bold ${kpi.highlight ? "text-success" : "text-foreground"}`}>
              {kpi.value}
            </p>
            <p className="text-xs text-text-muted mt-1">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* Monthly donation chart */}
      {chartData.length > 0 && (
        <div className="bg-surface rounded-xl border border-border p-6">
          <h3 className="text-sm font-semibold text-foreground mb-1">
            Revenus des dons par mois
          </h3>
          <p className="text-xs text-text-muted mb-4">
            Dons uniques vs réguliers — source GA4 e-commerce
          </p>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e6ea" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#6b7280" }} />
                <YAxis
                  yAxisId="revenue"
                  tick={{ fontSize: 11, fill: "#6b7280" }}
                  label={{ value: "Revenu (€)", angle: -90, position: "insideLeft", style: { fontSize: 10, fill: "#9ca3af" } }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 11, fill: "#6b7280" }}
                  domain={[0, "auto"]}
                  label={{ value: "Nombre de dons", angle: 90, position: "insideRight", style: { fontSize: 10, fill: "#9ca3af" } }}
                />
                <Tooltip
                  contentStyle={{
                    background: "#fff",
                    border: "1px solid #e2e6ea",
                    borderRadius: "8px",
                    fontSize: "13px",
                  }}
                  formatter={(value, name) => {
                    const n = Number(value);
                    if (String(name) === "Nombre de dons") {
                      return [new Intl.NumberFormat("fr-BE").format(n), name];
                    }
                    return [
                      new Intl.NumberFormat("fr-BE", {
                        style: "currency",
                        currency: "EUR",
                        maximumFractionDigits: 0,
                      }).format(n),
                      name,
                    ];
                  }}
                />
                <Legend
                  verticalAlign="top"
                  iconSize={8}
                  wrapperStyle={{ fontSize: "11px", paddingBottom: "8px" }}
                />
                <Bar
                  yAxisId="revenue"
                  dataKey="Dons uniques (€)"
                  fill="#f04f26"
                  radius={[4, 4, 0, 0]}
                  stackId="stack"
                />
                <Bar
                  yAxisId="revenue"
                  dataKey="Dons réguliers (€)"
                  fill="#8b5cf6"
                  radius={[4, 4, 0, 0]}
                  stackId="stack"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="Nombre de dons"
                  stroke="#21365e"
                  strokeWidth={2.5}
                  strokeDasharray="6 3"
                  dot={{ r: 5, fill: "#21365e", strokeWidth: 2, stroke: "#fff" }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Attribution by channel */}
      {channelData.length > 0 && (
        <div className="bg-surface rounded-xl border border-border p-6">
          <h3 className="text-sm font-semibold text-foreground mb-1">
            Revenus par canal d&apos;acquisition
          </h3>
          <p className="text-xs text-text-muted mb-4">
            Attribution GA4 par sessionDefaultChannelGroup
          </p>
          <div className="grid lg:grid-cols-[1fr_280px] gap-6">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={channelData}
                  layout="vertical"
                  margin={{ top: 0, right: 10, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e6ea" horizontal={false} />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11, fill: "#6b7280" }}
                    tickFormatter={(v) =>
                      new Intl.NumberFormat("fr-BE", {
                        style: "currency",
                        currency: "EUR",
                        maximumFractionDigits: 0,
                      }).format(v)
                    }
                  />
                  <YAxis
                    type="category"
                    dataKey="channel"
                    width={110}
                    tick={{ fontSize: 11, fill: "#6b7280" }}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#fff",
                      border: "1px solid #e2e6ea",
                      borderRadius: "8px",
                      fontSize: "13px",
                    }}
                    formatter={(value, name) => {
                      const n = Number(value);
                      if (String(name) === "transactions") {
                        return [new Intl.NumberFormat("fr-BE").format(n), "Transactions"];
                      }
                      return [
                        new Intl.NumberFormat("fr-BE", {
                          style: "currency",
                          currency: "EUR",
                          maximumFractionDigits: 0,
                        }).format(n),
                        "Revenu",
                      ];
                    }}
                  />
                  <Bar dataKey="revenue" radius={[0, 4, 4, 0]} name="revenue">
                    {channelData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            {/* Channel table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left text-[10px] uppercase tracking-wide text-text-muted pb-2">Canal</th>
                    <th className="text-right text-[10px] uppercase tracking-wide text-text-muted pb-2">Revenu</th>
                    <th className="text-right text-[10px] uppercase tracking-wide text-text-muted pb-2">Tx</th>
                    <th className="text-right text-[10px] uppercase tracking-wide text-text-muted pb-2">%</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {channelData.map((row) => {
                    const pct = totalRevenue > 0 ? (row.revenue / totalRevenue) * 100 : 0;
                    return (
                      <tr key={row.channel}>
                        <td className="py-1.5 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: row.color }} />
                          <span className="text-foreground text-xs">{row.channel}</span>
                        </td>
                        <td className="py-1.5 text-right tabular-nums text-xs text-text-muted">
                          {formatCurrency(row.revenue)}
                        </td>
                        <td className="py-1.5 text-right tabular-nums text-xs text-text-muted">
                          {formatNumber(row.transactions)}
                        </td>
                        <td className="py-1.5 text-right tabular-nums text-xs text-text-muted">
                          {pct.toFixed(1)}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
