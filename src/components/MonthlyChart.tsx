"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import type { QueryRow } from "@/lib/api";
import { monthLabel } from "@/lib/format";

interface MonthlyChartProps {
  fbMonthly: QueryRow[];
  ga4Monthly: QueryRow[];
}

export default function MonthlyChart({ fbMonthly, ga4Monthly }: MonthlyChartProps) {
  // Merge by month
  const months = new Set<string>();
  fbMonthly.forEach((r) => months.add(String(r.month)));
  ga4Monthly.forEach((r) => months.add(String(r.month)));

  const data = Array.from(months)
    .sort()
    .map((month) => {
      const fb = fbMonthly.find((r) => r.month === month);
      const ga = ga4Monthly.find((r) => r.month === month);
      return {
        month: monthLabel(month),
        "Meta Ads — Dépenses (€)": Number(fb?.spend) || 0,
        "Meta Ads — Clics": Number(fb?.clicks) || 0,
        "GA4 — Sessions": Number(ga?.sessions) || 0,
        "GA4 — Utilisateurs": Number(ga?.activeUsers) || 0,
      };
    });

  return (
    <div className="bg-surface rounded-xl border border-border p-6">
      <h2 className="text-sm font-semibold text-foreground mb-1">
        Évolution mensuelle
      </h2>
      <p className="text-xs text-text-muted mb-4">Meta Ads & GA4 — Nov/Déc 2025</p>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e6ea" />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#6b7280" }} />
            <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} />
            <Tooltip
              contentStyle={{
                background: "#fff",
                border: "1px solid #e2e6ea",
                borderRadius: "8px",
                fontSize: "13px",
              }}
              formatter={(value) =>
                new Intl.NumberFormat("fr-BE").format(Math.round(Number(value)))
              }
            />
            <Legend
              verticalAlign="top"
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: "11px", paddingBottom: "8px" }}
            />
            <Bar dataKey="GA4 — Sessions" fill="#E37400" radius={[4, 4, 0, 0]} />
            <Bar dataKey="GA4 — Utilisateurs" fill="#F59E0B" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Meta Ads — Clics" fill="#1877F2" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
