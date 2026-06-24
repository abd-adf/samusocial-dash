"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import type { QueryRow } from "@/lib/api";

interface SpendChartProps {
  fbData: QueryRow[];
  gadsData: QueryRow[];
}

export default function SpendChart({ fbData, gadsData }: SpendChartProps) {
  const fbSpend = fbData.reduce((s, r) => s + (Number(r.spend) || 0), 0);
  const gadsSpend = gadsData.reduce(
    (s, r) => s + (Number(r["metrics.cost_micros"]) || 0),
    0
  );

  const data = [
    { name: "Meta Ads", value: Math.round(fbSpend) },
    { name: "Google Ads (Paid)", value: Math.round(gadsSpend) },
  ].filter((d) => d.value > 0);

  const colors = ["#1877F2", "#4285F4"];

  return (
    <div className="bg-surface rounded-xl border border-border p-6">
      <h2 className="text-sm font-semibold text-foreground mb-1">
        Répartition du budget
      </h2>
      <p className="text-xs text-text-muted mb-4">Par plateforme publicitaire</p>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={90}
              paddingAngle={4}
              dataKey="value"
              stroke="none"
            >
              {data.map((_, i) => (
                <Cell key={i} fill={colors[i % colors.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: "#fff",
                border: "1px solid #e2e6ea",
                borderRadius: "8px",
                fontSize: "13px",
              }}
              formatter={(value) =>
                `${new Intl.NumberFormat("fr-BE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(Number(value))}`
              }
            />
            <Legend
              verticalAlign="bottom"
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: "12px" }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
