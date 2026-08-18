"use client";

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { EmptyState } from "@/components/ui";
import { Cat } from "lucide-react";

interface PieChartData {
  name: string;
  value: number;
}

interface AnimalDistributionChartProps {
  data: PieChartData[];
}

const CHART_COLORS = ["#4E79A7", "#E15759", "#76B7B2", "#59A14F", "#F28E2B"];

const CHART_DIMENSIONS = {
  OUTER_RADIUS: 90,
} as const;

const ICON_SIZE = 32;

export default function AnimalDistributionChart({
  data,
}: AnimalDistributionChartProps) {
  const hasAnimals = data.length > 0;

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col h-[400px]">
      <div className="mb-6">
        <h2 className="text-lg font-bold text-[#1e3a29]">
          Distribuição por Tipo de Animal
        </h2>
        <p className="text-slate-500 text-sm">Composição atual do rebanho</p>
      </div>

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
                label={({ percent }) => `(${(percent * 100).toFixed(0)}%)`}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={CHART_COLORS[index % CHART_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
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
    </div>
  );
}
