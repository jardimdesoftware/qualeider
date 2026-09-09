"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import {
  Activity,
  BarChart3,
  Droplet,
  Milk,
  PawPrint,
  Ruler,
  TrendingUp,
} from "lucide-react";
import { DashboardLoading, PageHeader } from "@/components/dashboard";
import { EmptyState, MetricCard } from "@/components/ui";
import { associationService } from "@/services/associationService";
import { HerdStats } from "@/interfaces/association";

const AnimalDistributionChart = dynamic(
  () => import("@/components/dashboard/AnimalDistributionChart"),
  {
    ssr: false,
    loading: () => (
      <p className="py-10 text-center text-brand-muted">Carregando gráfico...</p>
    ),
  },
);

const MilkLast7DaysChart = dynamic(
  () => import("@/components/dashboard/MilkLast7DaysChart"),
  {
    ssr: false,
    loading: () => (
      <p className="py-10 text-center text-brand-muted">Carregando gráfico...</p>
    ),
  },
);

export default function DashboardAssociation() {
  const [stats, setStats] = useState<HerdStats | null>(null);
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

  const totalAnimals = stats?.totalAnimals || 0;
  const totalMilkThisMonth = useMemo(() => stats?.totalMilkDay || 0, [stats]);
  const pieChartData = useMemo(() => stats?.breedDistribution || [], [stats]);
  const lineChartData = useMemo(() => stats?.productionHistory || [], [stats]);

  const hasAnimals = totalAnimals > 0;
  const hasCollections = lineChartData.length > 0;
  const averageAnimalAge = stats?.averageAnimalAge || 0;
  const totalMilkingThisMonth = stats?.totalMilkingThisMonth || 0;
  const lactatingCows = stats?.lactatingCows || 0;
  const avgProduction = stats?.avgProduction || 0;

  if (loading) {
    return <DashboardLoading />;
  }

  return (
    <>
      <PageHeader
        title="Painel da associação"
        subtitle="Visão regional da produção, do rebanho e dos associados."
      />

      <main className="mx-auto w-full max-w-7xl space-y-8 p-4 md:p-6 lg:p-8">
        {(!hasAnimals || !hasCollections) && (
          <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {!hasAnimals && (
              <EmptyState
                icon={<PawPrint size={40} />}
                title="Nenhum animal cadastrado"
                description="Cadastre animais para visualizar métricas e gráficos."
                actionHref="/manageMyAnimals"
                actionLabel="Cadastrar animal"
              />
            )}
            {!hasCollections && (
              <EmptyState
                icon={<Milk size={40} />}
                title="Nenhuma coleta diária registrada"
                description="Registre coletas para visualizar o histórico."
                actionHref="/dailyForm"
                actionLabel="Registrar coleta"
              />
            )}
          </section>
        )}

        <section>
          <div className="mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-brand-primary" />
            <h3 className="text-lg font-extrabold text-gray-950">
              Resumo regional
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            <MetricCard
              icon={<PawPrint size={24} />}
              iconColor="text-brand-primary"
              iconBgColor="bg-brand-accent"
              title="Total de animais"
              value={totalAnimals}
            />

            <MetricCard
              icon={<Milk size={24} />}
              iconColor="text-gov-blue"
              iconBgColor="bg-blue-50"
              borderColor="border-gov-blue"
              title="Leite coletado"
              value={totalMilkThisMonth.toFixed(0)}
              unit="litros"
            />

            <MetricCard
              icon={<Ruler size={24} />}
              iconColor="text-brand-secondary"
              iconBgColor="bg-red-50"
              borderColor="border-brand-secondary"
              title="Idade média"
              value={averageAnimalAge.toFixed(1)}
              unit="anos"
            />

            <MetricCard
              icon={<TrendingUp size={24} />}
              iconColor="text-brand-primary"
              iconBgColor="bg-brand-accent"
              title="Média por animal"
              value={avgProduction.toFixed(1)}
              unit="L/animal"
            />

            <MetricCard
              icon={<Activity size={24} />}
              iconColor="text-brand-primary"
              iconBgColor="bg-brand-accent"
              title="Total de ordenhas"
              value={totalMilkingThisMonth}
              unit="realizadas"
            />

            <MetricCard
              icon={<Droplet size={24} />}
              iconColor="text-gov-blue"
              iconBgColor="bg-blue-50"
              borderColor="border-gov-blue"
              title="Vacas em lactação"
              value={lactatingCows}
              unit="animais"
            />
          </div>
        </section>

        <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <AnimalDistributionChart data={pieChartData} />
          <MilkLast7DaysChart data={lineChartData} />
        </section>
      </main>
    </>
  );
}
