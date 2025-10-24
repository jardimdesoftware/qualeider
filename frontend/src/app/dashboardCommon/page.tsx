"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/sidebar";
import { apiBase } from "@/services/baseApi";
import EmptyState from "@/components/empty-state";
import axios from "axios";
import { Activity, Milk, Cat, Ruler, Wheat, Droplet } from "lucide-react";
import { Animal } from "@/interfaces/animal";
import { DailyCollection } from "@/interfaces/daily-collection";
import MetricCard from "@/components/metric-card";
import AnimalDistributionChart from "@/components/dashboard/AnimalDistributionChart";
import MilkLast7DaysChart from "@/components/dashboard/MilkLast7DaysChart";
import DashboardLoading from "@/components/dashboard/DashboardLoading";

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
    return <DashboardLoading />;
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
          <MetricCard
            icon={<Cat size={24} />}
            iconColor="text-green-500"
            title="Total de Animais"
            value={totalAnimals}
          />

          <MetricCard
            icon={<Milk size={24} />}
            iconColor="text-blue-500"
            title="Leite Coletado (Mês)"
            value={totalMilkThisMonth.toFixed(2)}
            unit="litros"
          />

          <MetricCard
            icon={<Ruler size={24} />}
            iconColor="text-purple-500"
            title="Idade Média dos Animais"
            value={averageAnimalAge.toFixed(1)}
            unit="anos"
          />

          <MetricCard
            icon={<Wheat size={24} />}
            iconColor="text-yellow-500"
            title="Ração Fornecida"
            value={`${rationProvidedPercentage.toFixed(1)}%`}
          />

          <MetricCard
            icon={<Activity size={24} />}
            iconColor="text-red-500"
            title="Total de Ordenhas (Mês)"
            value={totalMilkingThisMonth}
          />

          <MetricCard
            icon={<Droplet size={24} />}
            iconColor="text-pink-500"
            title="Média de Lactações (Mês)"
            value={averageLactationsThisMonth.toFixed(1)}
          />
        </div>

        {/* Gráficos */}
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Gráfico de Pizza - Distribuição por Tipo de Animal */}
          <AnimalDistributionChart data={pieChartData} />

          {/* Gráfico de Linhas - Leite Coletado nos Últimos 7 Dias */}
          <MilkLast7DaysChart data={lineChartData} />
        </div>
      </div>
    </div>
  );
}
