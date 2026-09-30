"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { EmptyState } from "@/components/ui";
import { Cat } from "lucide-react";
import ChartCard from "./ChartCard";

interface PieChartData {
  name: string;
  value: number;
}

interface AnimalDistributionChartProps {
  data: PieChartData[];
  title?: string;
  subtitle?: string;
  unitLabel?: string;
}

// Paleta alinhada as cores da marca ja usadas nos MetricCard/gráfico de leite
// (verde principal, âmbar, e os mesmos tons complementares dos ícones).
const CHART_COLORS = ["#2f9e41", "#d97706", "#2563eb", "#9333ea", "#0284c7"];

const CHART_DIMENSIONS = {
  OUTER_RADIUS: 90,
} as const;

const ICON_SIZE = 32;

const RADIAN = Math.PI / 180;

// Label percentual dentro da fatia — evita o antigo rótulo "nome (xx%)"
// flutuando para fora do card em containers estreitos (grid de 2 colunas).
const renderInsideLabel = ({ cx, cy, midAngle, outerRadius, percent }: any) => {
  if (percent < 0.06) return null;
  const radius = outerRadius * 0.65;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text
      x={x}
      y={y}
      textAnchor="middle"
      dominantBaseline="central"
      fill="#fff"
      fontSize={12}
      fontWeight={700}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

const CustomTooltip = ({ active, payload, unitLabel }: any) => {
  if (active && payload && payload.length) {
    const entry = payload[0];
    return (
      <div className="bg-white p-3 border border-slate-100 shadow-lg rounded-xl text-sm">
        <p className="font-bold text-slate-700 mb-1">{entry.name}</p>
        <p className="font-semibold" style={{ color: entry.payload.fill }}>
          {entry.value} {unitLabel}
        </p>
      </div>
    );
  }
  return null;
};

export default function AnimalDistributionChart({
  data,
  title = "Distribuição por Tipo de Animal",
  subtitle = "Composição atual do rebanho",
  unitLabel = "animais",
}: AnimalDistributionChartProps) {
  const hasAnimals = data.length > 0;

  return (
    <ChartCard title={title} subtitle={subtitle}>
      {hasAnimals ? (
        <div className="flex-1 w-full min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                outerRadius={CHART_DIMENSIONS.OUTER_RADIUS}
                fill="#8884d8"
                dataKey="value"
                labelLine={false}
                label={renderInsideLabel}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={CHART_COLORS[index % CHART_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                content={(props: any) => (
                  <CustomTooltip {...props} unitLabel={unitLabel} />
                )}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <EmptyState
            icon={<Cat size={ICON_SIZE} />}
            title="Sem dados de animais"
            description="Cadastre animais para ver a distribuição por tipo."
            actionHref="/manageMyAnimals"
            actionLabel="Cadastrar animal"
          />
        </div>
      )}
    </ChartCard>
  );
}
