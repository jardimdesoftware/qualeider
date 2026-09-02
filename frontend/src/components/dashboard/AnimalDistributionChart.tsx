"use client";

import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { EmptyState } from "@/components/ui";
import { PawPrint } from "lucide-react";

interface PieChartData {
  name: string;
  value: number;
}

interface AnimalDistributionChartProps {
  data: PieChartData[];
}

const CHART_COLORS = ["#2F9E41", "#1351B4", "#CD191E", "#76B7B2", "#F2C94C"];

export default function AnimalDistributionChart({
  data,
}: AnimalDistributionChartProps) {
  const hasAnimals = data.length > 0;

  return (
    <div className="campus-card flex h-[400px] flex-col p-5 md:p-6">
      <div className="mb-6">
        <h2 className="text-lg font-extrabold text-gray-950">
          Distribuição por tipo de animal
        </h2>
        <p className="text-sm text-brand-muted">Composição atual do rebanho</p>
      </div>

      {hasAnimals ? (
        <div className="min-h-0 w-full flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                outerRadius={92}
                dataKey="value"
                label={({ percent }) =>
                  `${((percent ?? 0) * 100).toFixed(0)}%`
                }
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${entry.name}-${index}`}
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
        <div className="flex flex-1 items-center justify-center">
          <EmptyState
            icon={<PawPrint size={32} />}
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
