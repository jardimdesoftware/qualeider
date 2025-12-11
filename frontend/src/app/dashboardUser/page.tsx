"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout";
import { apiBase } from "@/services/baseApi";
import { MetricCard, EmptyState } from "@/components/ui";
import { Activity, Milk, Cat, Ruler, Wheat, Droplet, BarChart3, Calendar } from "lucide-react";
import { Animal } from "@/interfaces/animal";
import { DailyCollection } from "@/interfaces/daily-collection";
import AnimalDistributionChart from "@/components/dashboard/AnimalDistributionChart";
import MilkLast7DaysChart from "@/components/dashboard/MilkLast7DaysChart";
import DashboardLoading from "@/components/dashboard/DashboardLoading";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { animalService } from "@/services/animalService";

export default function DashboardUser() {
  const { userId, isLoading: authLoading } = useAuthGuard("user");
  
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [dailyCollections, setDailyCollections] = useState<DailyCollection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const fetchData = async () => {
      const token = localStorage.getItem("authToken");
      const headers = { Authorization: `Bearer ${token}` };

      const [animalsResult, collectionsResult] = await Promise.allSettled([
        animalService.getByUser(userId),
        apiBase.get(`/daily-collections/user/${userId}`, { headers }),
    ]);

      if (animalsResult.status === "fulfilled") {
        setAnimals(animalsResult.value);
      } else {
        console.error("Erro ao buscar animais:", animalsResult.reason);
        setAnimals([]);
      }

      if (collectionsResult.status === "fulfilled") {
        setDailyCollections(collectionsResult.value.data);
      } else {
        console.error("Erro ao buscar coletas:", collectionsResult.reason);
        setDailyCollections([]);
      }

      setLoading(false);
    };

    fetchData();
  }, [userId]);

  // Métricas
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
      ? (dailyCollections.filter((collection) => collection.rationProvided).length /
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
      ? dailyCollections.reduce((sum, collection) => sum + collection.numLactation, 0) /
        dailyCollections.length
      : 0;

  // Dados para gráficos
  const animalTypeDistribution = animals.reduce((acc, animal) => {
    acc[animal.animalType] = (acc[animal.animalType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const pieChartData = Object.entries(animalTypeDistribution).map(([type, count]) => ({
    name: type,
    value: count,
  }));

  const milkByDayLast7Days = dailyCollections
    .filter((collection) => {
      const collectionDate = new Date(collection.collectionDate);
      const today = new Date();
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(today.getDate() - 7);
      return collectionDate >= sevenDaysAgo && collectionDate <= today;
    })
    .reduce((acc, collection) => {
      const date = new Date(collection.collectionDate).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
      });
      acc[date] = (acc[date] || 0) + collection.quantity;
      return acc;
    }, {} as Record<string, number>);

  const lineChartData = Object.entries(milkByDayLast7Days).map(([date, quantity]) => ({
    date,
    quantity,
  }));

  const hasAnimals = animals.length > 0;
  const hasCollections = dailyCollections.length > 0;

  const currentDate = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  if (loading) {
    return <DashboardLoading />;
  }

  return (
    <div className="flex flex-col lg:flex-row bg-[#fdfbf7] min-h-screen">
      <Sidebar />
      <div className="flex-1 overflow-y-auto">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-slate-200 px-6 md:px-8 py-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-black text-[#1e3a29]">
              Painel de Controle
            </h2>
            <p className="text-slate-500">
              Bem-vindo de volta!
            </p>
          </div>
          <div className="flex items-center gap-4 bg-[#fdfbf7] px-4 py-2 rounded-lg border border-slate-200">
            <div className="text-right hidden md:block">
              <p className="text-xs text-slate-400 font-bold uppercase">Data de Hoje</p>
              <p className="text-[#1e3a29] font-bold">{currentDate}</p>
            </div>
            <Calendar className="w-8 h-8 text-[#d97706]" />
          </div>
        </header>

        <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
          {/* Empty States */}
          {(!hasAnimals || !hasCollections) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {!hasAnimals && (
                <EmptyState
                  icon={<Cat size={40} />}
                  title="Nenhum animal cadastrado"
                  description="Cadastre seu primeiro animal para ver métricas e gráficos."
                  actionHref="/manageMyAnimals"
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

          {/* Seção 1: Resumo do Mês */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-5 h-5 text-[#d97706]" />
              <h3 className="text-lg font-bold text-[#1e3a29] uppercase tracking-wide">
                Resumo do Mês
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <MetricCard
                icon={<Cat size={24} />}
                iconColor="text-green-600"
                iconBgColor="bg-green-50"
                borderColor="border-[#1e3a29]"
                title="Total de Animais"
                value={totalAnimals}
              />

              <MetricCard
                icon={<Milk size={24} />}
                iconColor="text-blue-600"
                iconBgColor="bg-blue-50"
                borderColor="border-[#1e3a29]"
                title="Leite Coletado"
                value={totalMilkThisMonth.toFixed(0)}
                unit="Litros"
              />

              <MetricCard
                icon={<Ruler size={24} />}
                iconColor="text-purple-600"
                iconBgColor="bg-purple-50"
                borderColor="border-[#d97706]"
                title="Idade Média"
                value={averageAnimalAge.toFixed(1)}
                unit="anos"
              />

              <MetricCard
                icon={<Wheat size={24} />}
                iconColor="text-amber-600"
                iconBgColor="bg-amber-50"
                borderColor="border-[#d97706]"
                title="Ração Fornecida"
                value={`${rationProvidedPercentage.toFixed(0)}%`}
                trend="das coletas"
              />

              <MetricCard
                icon={<Activity size={24} />}
                iconColor="text-green-700"
                iconBgColor="bg-green-50"
                borderColor="border-[#1e3a29]"
                title="Total Ordenhas"
                value={totalMilkingThisMonth}
                unit="Realizadas"
              />

              <MetricCard
                icon={<Droplet size={24} />}
                iconColor="text-red-600"
                iconBgColor="bg-red-50"
                borderColor="border-red-500"
                title="Média Lactações"
                value={averageLactationsThisMonth.toFixed(1)}
                unit="Kg/dia"
              />
            </div>
          </section>

          {/* Seção 2: Gráficos */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AnimalDistributionChart data={pieChartData} />
            <MilkLast7DaysChart data={lineChartData} />
          </section>
        </div>
      </div>
    </div>
  );
}
