"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/sidebar";
import { apiBase } from "@/services/baseApi";
import { Activity, PieChart as PieChartIcon, BarChart2 } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { Animal } from "@/interfaces/animal";
import MetricCard from "@/components/metric-card";
import AnimalDistributionChart from "@/components/dashboard/AnimalDistributionChart";
import DashboardLoading from "@/components/dashboard/DashboardLoading";

export default function AnimalDashboard() {
  const router = useRouter();
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      if (payload.role !== "Admin") {
        router.push("/");
      } else {
        setLoading(false);
      }
    } catch (err) {
      console.error("Erro ao decodificar o token:", err);
      router.push("/login");
    }
  }, [router]);

  useEffect(() => {
    if (loading) return;

    const fetchAnimals = async () => {
      const token = localStorage.getItem("authToken");
      try {
        const response = await apiBase.get<{ data: Animal[] }>("/animals", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setAnimals(response.data.data);
        setLoading(false);
      } catch (err) {
        console.error("Erro ao carregar os animais:", err);
        setLoading(false);
        setError("Erro ao carregar os animais.");
      }
    };

    fetchAnimals();
  }, [loading]);

  // Métricas gerais
  const totalAnimals = animals.length;
  const averageAge = (
    animals.reduce((sum, animal) => sum + animal.age, 0) / totalAnimals
  ).toFixed(1);

  // Dados para o gráfico de pizza (distribuição por tipo de animal)
  const animalTypeDistribution = animals.reduce((acc, animal) => {
    acc[animal.animalType] = (acc[animal.animalType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const pieChartData = Object.entries(animalTypeDistribution).map(
    ([type, count]) => ({
      name: type,
      value: count,
    })
  );

  // Dados para o gráfico de linhas (média de idade por tipo de animal)
  const averageAgeByType = animals.reduce((acc, animal) => {
    if (!acc[animal.animalType]) {
      acc[animal.animalType] = { totalAge: 0, count: 0 };
    }
    acc[animal.animalType].totalAge += animal.age;
    acc[animal.animalType].count += 1;
    return acc;
  }, {} as Record<string, { totalAge: number; count: number }>);

  const lineChartData = Object.entries(averageAgeByType).map(
    ([type, data]) => ({
      type,
      averageAge: (data.totalAge / data.count).toFixed(1),
    })
  );

  if (loading) return <DashboardLoading />;

  if (error) return <div>Erro: {error}</div>;

  return (
    <div className="flex flex-col lg:flex-row">
      <Sidebar />
      <div className="flex-1 p-8">
        <h1 className="text-2xl font-bold mb-6 mt-12 md:mt-4">
          Animais Cadastrados
        </h1>

        {/* Métricas Gerais */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <MetricCard
            icon={<Activity size={24} />}
            iconColor="text-green-500"
            title="Total de Animais"
            value={totalAnimals}
          />

          <MetricCard
            icon={<PieChartIcon size={24} />}
            iconColor="text-purple-500"
            title="Tipos de Animais"
            value={Object.keys(animalTypeDistribution).length}
          />

          <MetricCard
            icon={<BarChart2 size={24} />}
            iconColor="text-yellow-500"
            title="Média de Idade"
            value={averageAge}
          />
        </div>

        {/* Gráficos */}
        <div className="flex flex-col lg:flex-row gap-10">
          {/* Gráfico de Pizza - Distribuição por Tipo de Animal */}
          <AnimalDistributionChart data={pieChartData} />

          {/* Gráfico de Linhas - Média de Idade por Tipo de Animal */}
          <div className="bg-white p-4 rounded-lg shadow flex-1 flex flex-col items-center">
            <h2 className="text-lg font-semibold mb-4">
              Média de Idade por Tipo de Animal
            </h2>
            <div className="w-full h-[300px] flex justify-center items-center">
              <LineChart
                width={500}
                height={300}
                data={lineChartData}
                margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="type" />
                <YAxis />
                <Tooltip />
                <Legend
                  align="center"
                  wrapperStyle={{
                    paddingTop: 10,
                    textAlign: "center",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="averageAge"
                  name="Média"
                  stroke="#9467BD"
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
