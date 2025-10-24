"use client";

import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import EmptyState from "@/components/empty-state";
import { Cat } from "lucide-react";

interface PieChartData {
  name: string;
  value: number;
}

interface AnimalDistributionChartProps {
  data: PieChartData[];
}

const COLORS = ["#4E79A7", "#E15759", "#76B7B2", "#59A14F", "#F28E2B"];

export default function AnimalDistributionChart({
  data,
}: AnimalDistributionChartProps) {
  const hasAnimals = data.length > 0;

  return (
    <div className="bg-white p-4 rounded-lg shadow flex-1 flex flex-col items-center min-h-[350px]">
      <h2 className="text-lg font-semibold mb-4">
        Distribuição por Tipo de Animal
      </h2>
      {hasAnimals ? (
        <div className="w-full flex justify-center">
          <PieChart width={345} height={300}>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              outerRadius={90}
              fill="#8884d8"
              dataKey="value"
              label={({ percent }) => `(${(percent * 100).toFixed(0)}%)`}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </div>
      ) : (
        <div className="w-full mt-4">
          <EmptyState
            icon={<Cat size={32} />}
            title="Sem dados de animais"
            description="Cadastre animais para ver a distribuição por tipo."
            actionHref="/manageAnimals/create"
            actionLabel="Cadastrar animal"
          />
        </div>
      )}
    </div>
  );
}
