"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  ResponsiveContainer,
} from "recharts";
import { EmptyState } from "@/components/ui";
import { Milk } from "lucide-react";
import { ICON_SIZES } from "@/constants/ui";
import ChartCard from "./ChartCard";

interface AnimalProductionBarChartProps {
  data: { name: string; total: number }[];
}

const BAR_COLORS = ["#2f9e41", "#d97706", "#237a32", "#cd191e", "#5f6b58"];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-slate-100 shadow-lg rounded-xl text-sm">
        <p className="font-bold text-slate-700 mb-1">{label}</p>
        <p className="font-semibold text-slate-800">
          {payload[0].value.toFixed(1)} L no mês
        </p>
      </div>
    );
  }
  return null;
};

export default function AnimalProductionBarChart({
  data,
}: AnimalProductionBarChartProps) {
  const hasData = data.some((d) => d.total > 0);

  return (
    <ChartCard title="Produção por Animal" subtitle="Total no mês, por vaca">
      {hasData ? (
        <div className="flex-1 w-full min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 0, right: 24, left: 0, bottom: 0 }}
            >
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="name"
                axisLine={false}
                tickLine={false}
                width={80}
                tick={{ fill: "#475569", fontSize: 12 }}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: "#f8fafc" }}
              />
              <Bar dataKey="total" radius={[0, 6, 6, 0]} barSize={18}>
                {data.map((_, index) => (
                  <Cell
                    key={index}
                    fill={BAR_COLORS[index % BAR_COLORS.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <EmptyState
            icon={<Milk size={ICON_SIZES.LG} />}
            title="Sem coletas no mês"
            description="Registre coletas para comparar a produção entre os animais."
            actionHref="/dailyForm"
            actionLabel="Registrar coleta"
          />
        </div>
      )}
    </ChartCard>
  );
}
