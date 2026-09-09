"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { EmptyState } from "@/components/ui";
import { Milk } from "lucide-react";
import { ICON_SIZES } from "@/constants/ui";

interface LineChartData {
  date: string;
  quantity: number;
}

interface MilkLast7DaysChartProps {
  data: LineChartData[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-md border border-brand-border bg-white p-3 text-sm shadow-lg">
        <p className="mb-1 font-bold text-gray-900">{label}</p>
        <p className="font-semibold text-gov-blue">{payload[0].value} litros</p>
      </div>
    );
  }

  return null;
};

export default function MilkLast7DaysChart({ data }: MilkLast7DaysChartProps) {
  const hasCollections = data.length > 0;

  return (
    <div className="campus-card flex h-[400px] flex-col p-5 md:p-6">
      <div className="mb-6">
        <h2 className="text-lg font-extrabold text-gray-950">
          Leite coletado
        </h2>
        <p className="text-sm text-brand-muted">Evolução dos últimos 7 dias</p>
      </div>

      {hasCollections ? (
        <div className="min-h-0 w-full flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorMilk" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1351B4" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="#1351B4" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                stroke="#E0E0E0"
                strokeDasharray="3 3"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#4B5563", fontSize: 12 }}
                tickMargin={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#4B5563", fontSize: 12 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="quantity"
                stroke="#1351B4"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorMilk)"
                activeDot={{ r: 6, strokeWidth: 0, fill: "#1351B4" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center">
          <EmptyState
            icon={<Milk size={ICON_SIZES.LG} />}
            title="Sem dados recentes"
            description="Registre coletas para ver o gráfico."
            actionHref="/dailyForm"
            actionLabel="Registrar coleta"
          />
        </div>
      )}
    </div>
  );
}
