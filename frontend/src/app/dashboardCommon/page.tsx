"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/siedbar";
import { apiBase } from "@/services/baseApi";
import EmptyState from "@/components/empty-state";
import axios from "axios";
import { Activity, Milk, Cat, Ruler, Wheat, Droplet } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

interface Animal {
  id: number;
  name: string;
  animalType: string;
  breed: string;
  age: number;
  userId: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface DailyCollection {
  id: number;
  quantity: number;
  collectionDate: string;
  userId: number;
  numAnimals: number;
  numOrdens: number;
  rationProvided: boolean;
  numLactation: number;
  milkingPlace: string;
  technicalAssistance: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function DashboardCommon() {
  const router = useRouter();
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [dailyCollections, setDailyCollections] = useState<DailyCollection[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [, setUserId] = useState<number | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      if (payload.role !== "Common") {
        router.push("/");
      } else {
        setUserId(payload.sub);
        fetchData(payload.sub);
        setLoading(false);
      }
    } catch (err) {
      console.error("Erro ao decodificar o token:", err);
      router.push("/login");
    }
  }, [router]);

  const fetchData = async (userId: number) => {
    const token = localStorage.getItem("authToken");
    const headers = {
      Authorization: `Bearer ${token}`,
    } as const;

    const [animalsResult, collectionsResult] = await Promise.allSettled([
      apiBase.get(`/animals/user/${userId}`, { headers }),
      apiBase.get(`/daily-collections/user/${userId}`, { headers }),
    ]);

    if (animalsResult.status === "fulfilled") {
      setAnimals(animalsResult.value.data);
    } else {
      const reason = animalsResult.reason;
      if (axios.isAxiosError(reason) && reason.response?.status === 404) {
        setAnimals([]);
      } else {
        console.error("Erro ao buscar animais:", reason);
      }
    }

    // Coletas diárias
    if (collectionsResult.status === "fulfilled") {
      setDailyCollections(collectionsResult.value.data);
    } else {
      const reason = collectionsResult.reason;
      if (axios.isAxiosError(reason) && reason.response?.status === 404) {
        // Sem coletas para o usuário -> tratar como lista vazia
        setDailyCollections([]);
      } else {
        console.error("Erro ao buscar coletas diárias:", reason);
      }
    }
  };

  // Funções para calcular as métricas
  const totalAnimals = animals.length;

  const totalMilkThisMonth = dailyCollections
    .filter((collection) => {
      const collectionDate = new Date(collection.collectionDate);
      const today = new Date();
      return (
        collectionDate.getMonth() === today.getMonth() &&
        collectionDate.getFullYear() === today.getFullYear()
      );
    })
    .reduce((sum, collection) => sum + collection.quantity, 0);

  const averageAnimalAge =
    animals.length > 0
      ? animals.reduce((sum, animal) => sum + animal.age, 0) / animals.length
      : 0;

  const rationProvidedPercentage =
    dailyCollections.length > 0
      ? (dailyCollections.filter((collection) => collection.rationProvided)
          .length /
          dailyCollections.length) *
        100
      : 0;

  const totalMilkingThisMonth = dailyCollections
    .filter((collection) => {
      const collectionDate = new Date(collection.collectionDate);
      const today = new Date();
      return (
        collectionDate.getMonth() === today.getMonth() &&
        collectionDate.getFullYear() === today.getFullYear()
      );
    })
    .reduce((sum, collection) => sum + collection.numOrdens, 0);

  const averageLactationsThisMonth =
    dailyCollections.length > 0
      ? dailyCollections.reduce(
          (sum, collection) => sum + collection.numLactation,
          0
        ) / dailyCollections.length
      : 0;

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

  // Dados para o gráfico de linhas (leite coletado nos últimos 7 dias)
  const milkByDayLast7Days = dailyCollections
    .filter((collection) => {
      const collectionDate = new Date(collection.collectionDate);
      const today = new Date();
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(today.getDate() - 7);
      return collectionDate >= sevenDaysAgo && collectionDate <= today;
    })
    .reduce((acc, collection) => {
      const date = new Date(collection.collectionDate).toLocaleDateString(
        "pt-BR",
        {
          day: "2-digit",
          month: "2-digit",
        }
      );
      acc[date] = (acc[date] || 0) + collection.quantity;
      return acc;
    }, {} as Record<string, number>);

  const lineChartData = Object.entries(milkByDayLast7Days).map(
    ([date, quantity]) => ({
      date,
      quantity,
    })
  );

  const hasAnimals = animals.length > 0;
  const hasCollections = dailyCollections.length > 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-10 h-10 border-4 border-green-700 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row">
      <Sidebar />
      <div className="flex-1 p-8">
        <h1 className="text-2xl font-bold mb-6 mt-12 md:mt-4">Dashboard</h1>

        {/* Empty states iniciais quando faltar dados */}
        {(!hasAnimals || !hasCollections) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {!hasAnimals && (
              <EmptyState
                icon={<Cat size={40} />}
                title="Nenhum animal cadastrado"
                description="Cadastre seu primeiro animal para ver métricas e gráficos."
                actionHref="/manageAnimals/create"
                actionLabel="Cadastrar animal"
              />
            )}
            {!hasCollections && (
              <EmptyState
                icon={<Milk size={40} />}
                title="Nenhuma coleta diária registrada"
                description="Registre sua primeira coleta para visualizar o histórico."
                actionHref="/dailyForm"
                actionLabel="Registrar coleta"
              />
            )}
          </div>
        )}

        {/* Cards com Métricas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 mb-8">
          {/* Card: Total de Animais Cadastrados */}
          <div className="bg-white p-4 rounded-lg shadow flex items-center">
            <Cat className="text-green-500 mr-2" size={24} />
            <div>
              <h3 className="text-lg font-semibold">Total de Animais</h3>
              <p className="text-2xl font-bold">{totalAnimals}</p>
            </div>
          </div>

          {/* Card: Total de Leite Coletado no Mês */}
          <div className="bg-white p-4 rounded-lg shadow flex items-center">
            <Milk className="text-blue-500 mr-2" size={24} />
            <div>
              <h3 className="text-lg font-semibold">Leite Coletado (Mês)</h3>
              <p className="text-2xl font-bold">
                {totalMilkThisMonth.toFixed(2)} litros
              </p>
            </div>
          </div>

          {/* Card: Idade Média dos Animais */}
          <div className="bg-white p-4 rounded-lg shadow flex items-center">
            <Ruler className="text-purple-500 mr-2" size={24} />
            <div>
              <h3 className="text-lg font-semibold">Idade Média dos Animais</h3>
              <p className="text-2xl font-bold">
                {averageAnimalAge.toFixed(1)} anos
              </p>
            </div>
          </div>

          {/* Card: Porcentagem de Ração Fornecida */}
          <div className="bg-white p-4 rounded-lg shadow flex items-center">
            <Wheat className="text-yellow-500 mr-2" size={24} />
            <div>
              <h3 className="text-lg font-semibold">Ração Fornecida</h3>
              <p className="text-2xl font-bold">
                {rationProvidedPercentage.toFixed(1)}%
              </p>
            </div>
          </div>

          {/* Card: Total de Ordenhas no Mês */}
          <div className="bg-white p-4 rounded-lg shadow flex items-center">
            <Activity className="text-red-500 mr-2" size={24} />
            <div>
              <h3 className="text-lg font-semibold">Total de Ordenhas (Mês)</h3>
              <p className="text-2xl font-bold">{totalMilkingThisMonth}</p>
            </div>
          </div>

          {/* Card: Média de Lactações no Mês */}
          <div className="bg-white p-4 rounded-lg shadow flex items-center">
            <Droplet className="text-pink-500 mr-2" size={24} />
            <div>
              <h3 className="text-lg font-semibold">
                Média de Lactações (Mês)
              </h3>
              <p className="text-2xl font-bold">
                {averageLactationsThisMonth.toFixed(1)}
              </p>
            </div>
          </div>
        </div>

        {/* Gráficos */}
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Gráfico de Pizza - Distribuição por Tipo de Animal */}
          <div className="bg-white p-4 rounded-lg shadow flex-1 flex flex-col items-center">
            <h2 className="text-lg font-semibold mb-4">
              Distribuição por Tipo de Animal
            </h2>
            {hasAnimals ? (
              <div className="w-full flex justify-center">
                <PieChart width={345} height={300}>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ percent }) => `(${(percent * 100).toFixed(0)}%)`}
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          [
                            "#4E79A7",
                            "#E15759",
                            "#76B7B2",
                            "#59A14F",
                            "#F28E2B",
                          ][index % 5]
                        }
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </div>
            ) : (
              <div className="w-full">
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

          {/* Gráfico de Linhas - Leite Coletado nos Últimos 7 Dias */}
          <div className="bg-white p-4 rounded-lg shadow flex-1 flex flex-col items-center">
            <h2 className="text-lg font-semibold mb-4">
              Leite Coletado (Últimos 7 Dias)
            </h2>
            {hasCollections ? (
              <div className="w-full h-[300px] flex justify-center items-center">
                <LineChart
                  width={500}
                  height={300}
                  data={lineChartData}
                  margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
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
                    dataKey="quantity"
                    name="Leite (litros)"
                    stroke="#9467BD"
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </div>
            ) : (
              <div className="w-full">
                <EmptyState
                  icon={<Milk size={32} />}
                  title="Sem dados de coletas"
                  description="Registre coletas diárias para visualizar o gráfico."
                  actionHref="/dailyForm"
                  actionLabel="Registrar coleta"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
