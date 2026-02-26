"use client";

import { useEffect, useState } from "react";
import { MetricCard } from "@/components/ui";
import { Cat, Milk, Activity, Crown, Baby, Calendar } from "lucide-react";
import dynamic from "next/dynamic";
const AnimalDistributionChart = dynamic(
  () => import("@/components/dashboard/AnimalDistributionChart"),
  {
    ssr: false,
    loading: () => (
      <p className="text-center py-10 text-slate-400">Carregando gráfico...</p>
    ),
  },
);
const MilkLast7DaysChart = dynamic(
  () => import("@/components/dashboard/MilkLast7DaysChart"),
  {
    ssr: false,
    loading: () => (
      <p className="text-center py-10 text-slate-400">Carregando gráfico...</p>
    ),
  },
);
import { associationService } from "@/services/associationService";
import DashboardLoading from "@/components/dashboard/DashboardLoading";

export default function RegionalHerdPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await associationService.getHerdStats();
        setStats(data);
      } catch (err) {
        console.error("Erro ao buscar estatísticas do rebanho:", err);
        setError("Erro ao carregar dados do rebanho.");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const [currentDate, setCurrentDate] = useState<string>("");

  useEffect(() => {
    setCurrentDate(
      new Date().toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
    );
  }, []);

  if (loading) return <DashboardLoading />;

  if (error || !stats)
    return (
      <div className="p-8 text-center text-red-500">
        <p>{error || "Dados indisponíveis."}</p>
      </div>
    );

  return (
    <main className="flex-1 overflow-y-auto">
      {/* Header específico para Rebanho */}
      <header className="bg-white shadow-sm border-b border-slate-200 px-8 py-6 flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-0 z-10">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-[#1e3a29] brand-font">
            Rebanho Regional
          </h2>
          <p className="text-slate-500">Consolidado regional</p>
        </div>
        <div className="flex items-center gap-4 bg-[#fdfbf7] px-4 py-2 rounded-lg border border-slate-200">
          <div className="text-right hidden md:block">
            <p className="text-xs text-slate-400 font-bold uppercase">
              Atualizado em
            </p>
            <p className="text-[#1e3a29] font-bold" suppressHydrationWarning>
              {currentDate || "Carregando..."}
            </p>
          </div>
          <Calendar className="w-8 h-8 text-[#d97706]" />
        </div>
      </header>

      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <MetricCard
            icon={<Cat size={24} />}
            iconColor="text-green-600"
            iconBgColor="bg-green-50"
            borderColor="border-[#1e3a29]"
            title="Total de Animais"
            value={stats.totalAnimals.toLocaleString()}
          />
          <MetricCard
            icon={<Milk size={24} />}
            iconColor="text-blue-600"
            iconBgColor="bg-blue-50"
            borderColor="border-[#1e3a29]"
            title="Produção Regional/Dia"
            value={stats.totalMilkDay.toLocaleString()}
            unit="Litros"
          />
          <MetricCard
            icon={<Activity size={24} />}
            iconColor="text-purple-600"
            iconBgColor="bg-purple-50"
            borderColor="border-[#d97706]"
            title="Média por Vaca"
            value={stats.avgProduction.toFixed(1)}
            unit="L/dia"
          />
        </div>

        {/* Detailed Herd Breakdown */}
        <section className="bg-white p-6 rounded-xl shadow-md border-t-4 border-[#d97706]">
          <h3 className="text-lg font-bold text-[#1e3a29] uppercase tracking-wide mb-6 flex items-center gap-2">
            <Crown className="w-5 h-5 text-[#d97706]" />
            Composição do Rebanho
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-50 rounded-lg text-center hover:bg-slate-100 transition">
              <p className="text-2xl font-black text-[#1e3a29]">
                {stats.lactatingCows.toLocaleString()}
              </p>
              <p className="text-slate-500 text-sm font-medium">
                Vacas em Lactação
              </p>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg text-center hover:bg-slate-100 transition">
              <p className="text-2xl font-black text-slate-400">
                {stats.dryCows.toLocaleString()}
              </p>
              <p className="text-slate-500 text-sm font-medium">Vacas Secas</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg text-center hover:bg-slate-100 transition">
              <div className="flex justify-center mb-1">
                <Baby className="w-5 h-5 text-amber-500" />
              </div>
              <p className="text-2xl font-black text-[#d97706]">
                {stats.heifers.toLocaleString()}
              </p>
              <p className="text-slate-500 text-sm font-medium">Novilhas</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg text-center hover:bg-slate-100 transition">
              <div className="flex justify-center mb-1">
                <Baby className="w-5 h-5 text-green-500" />
              </div>
              <p className="text-2xl font-black text-[#4ade80]">
                {stats.calves.toLocaleString()}
              </p>
              <p className="text-slate-500 text-sm font-medium">Bezerras</p>
            </div>
          </div>
        </section>

        {/* Charts */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AnimalDistributionChart data={stats.breedDistribution} />
          <div className="bg-white p-6 rounded-xl shadow-md border border-slate-100">
            <h3 className="text-lg font-bold text-[#1e3a29] mb-4">
              Volume de Leite Regional (7 dias)
            </h3>
            <MilkLast7DaysChart data={stats.productionHistory} />
          </div>
        </section>
      </div>
    </main>
  );
}
