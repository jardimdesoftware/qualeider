"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout";
import { PageHeader } from "@/components/dashboard";
import { EmptyState, MetricCard } from "@/components/ui";
import { Activity, Milk, Cat, Ruler, Wheat, Droplet, BarChart3 } from "lucide-react";
import dynamic from "next/dynamic";
const AnimalDistributionChart = dynamic(() => import("@/components/dashboard/AnimalDistributionChart"), { ssr: false, loading: () => <p className="text-center py-10 text-slate-400">Carregando gráfico...</p> });
const MilkLast7DaysChart = dynamic(() => import("@/components/dashboard/MilkLast7DaysChart"), { ssr: false, loading: () => <p className="text-center py-10 text-slate-400">Carregando gráfico...</p> });
import DashboardLoading from "@/components/dashboard/DashboardLoading";
import { associationService } from "@/services/associationService";

export default function DashboardAssociation() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await associationService.getHerdStats();
        setStats(data);
      } catch (error) {
        console.error("Erro ao buscar estatísticas:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const [currentDate, setCurrentDate] = useState<string>("");

  useEffect(() => {
    setCurrentDate(
      new Date().toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    );
  }, []);

  const totalAnimals = stats?.totalAnimals || 0;
  const [totalMilkThisMonth, setTotalMilkThisMonth] = useState(0);
  const [pieChartData, setPieChartData] = useState<any[]>([]);
  const [lineChartData, setLineChartData] = useState<any[]>([]);

  useEffect(() => {
    if (stats) {
      setTotalMilkThisMonth(stats.totalMilkDay || 0);
      setPieChartData(stats.breedDistribution || []);
      setLineChartData(stats.productionHistory || []);
    }
  }, [stats]);

  const hasAnimals = totalAnimals > 0;
  const hasCollections = lineChartData.length > 0;
  const averageAnimalAge = stats?.averageAnimalAge || 0;
  const rationProvidedPercentage = stats?.rationProvidedPercentage || 0;
  const totalMilkingThisMonth = stats?.totalMilkingThisMonth || 0;
  const averageLactationsThisMonth = stats?.averageLactationsThisMonth || 0;

  if (loading) {
    return <DashboardLoading />;
  }

  return (
    <DashboardLayout>
      <PageHeader
        title="Painel de Controle"
        subtitle="Bem-vindo de volta!"
      />

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
    </DashboardLayout>
  );
}
