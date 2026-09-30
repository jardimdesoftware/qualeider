"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { EmptyState } from "@/components/ui";
import { Milk } from "lucide-react";
import { ICON_SIZES } from "@/constants/ui";
import ChartCard from "./ChartCard";

interface LineChartData {
  date: string;
  quantity: number;
}

interface MilkLast7DaysChartProps {
  data: LineChartData[];
  emptyDescription?: string;
  showEmptyAction?: boolean;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-slate-100 shadow-lg rounded-xl text-sm">
        <p className="font-bold text-slate-700 mb-1">{label}</p>
        <p className="font-semibold text-slate-800">
          {payload[0].value} Litros
        </p>
      </div>
    );
  }
  return null;
};

export default function MilkLast7DaysChart({
  data,
  emptyDescription = "Registre coletas para ver o gráfico.",
  showEmptyAction = true,
}: MilkLast7DaysChartProps) {
  const hasCollections = data.length > 0;

  return (
    <ChartCard title="Leite Coletado" subtitle="Evolução dos últimos 7 dias">
      {hasCollections ? (
        <div className="flex-1 w-full min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorMilk" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2f9e41" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#2f9e41" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#f1f5f9"
              />
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#64748b", fontSize: 12 }}
                tickMargin={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#64748b", fontSize: 12 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="quantity"
                stroke="#2f9e41"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorMilk)"
                activeDot={{ r: 6, strokeWidth: 0, fill: "#2f9e41" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <EmptyState
            icon={<Milk size={ICON_SIZES.LG} />}
            title="Sem dados recentes"
            description={emptyDescription}
            actionHref={showEmptyAction ? "/dailyForm" : undefined}
            actionLabel={showEmptyAction ? "Registrar coleta" : undefined}
          />
        </div>
      )}
    </ChartCard>
  );
}
