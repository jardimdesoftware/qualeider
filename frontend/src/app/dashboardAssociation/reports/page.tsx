"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { reportService } from "@/services/reportService";
import { ProducerRanking, MonthlyReport } from "@/interfaces/report";
import ReportFilters from "@/components/reports/ReportFilters";
import ProducerRankingTable from "@/components/reports/ProducerRankingTable";
import ReportExportButton from "@/components/reports/ReportExportButton";
import { MetricCard } from "@/components/ui";
import {
  BarChart3,
  Users,
  Milk,
  TrendingUp,
  Cat,
  Calendar,
} from "lucide-react";
import DashboardLoading from "@/components/dashboard/DashboardLoading";

export default function ReportsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [ranking, setRanking] = useState<ProducerRanking[]>([]);
  const [monthlyReport, setMonthlyReport] = useState<MonthlyReport | null>(
    null,
  );
  const [filterDates, setFilterDates] = useState<{
    start: string | null;
    end: string | null;
  }>({
    start: null,
    end: null,
  });

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async (startDate?: string, endDate?: string) => {
    setLoading(true);
    try {
      // Buscar ranking e relatório mensal em paralelo
      const [rankingData, monthlyData] = await Promise.all([
        reportService.getProducerRanking(startDate, endDate),
        reportService.getCurrentMonthReport(),
      ]);

      setRanking(rankingData);
      setMonthlyReport(monthlyData);
    } catch (error) {
      console.error("Erro ao buscar relatórios:", error);

      // Verificar se é erro de autenticação
      if (error instanceof Error && error.message.includes("401")) {
        router.push("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (
    startDate: string | null,
    endDate: string | null,
    period: string,
  ) => {
    setFilterDates({ start: startDate, end: endDate });

    if (startDate && endDate) {
      fetchReports(startDate, endDate);
    }
  };

  const [currentDate, setCurrentDate] = useState<string>("");

  useEffect(() => {
    setCurrentDate(
      new Date().toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }),
    );
  }, []);

  if (loading) {
    return <DashboardLoading />;
  }

  return (
    <>
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200 px-6 md:px-8 py-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-black text-[#1e3a29]">
              Relatórios e Análises
            </h2>
            <p className="text-slate-500">
              Acompanhe o desempenho e estatísticas da associação
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* Botão de Exportação */}
            <ReportExportButton
              ranking={ranking}
              monthlyReport={monthlyReport}
              associationName="Associação Regional"
            />

            {/* Data */}
            <div className="flex items-center gap-4 bg-[#fdfbf7] px-4 py-2 rounded-lg border border-slate-200">
              <div className="text-right hidden md:block">
                <p className="text-xs text-slate-400 font-bold uppercase">
                  Data de Hoje
                </p>
                <p
                  className="text-[#1e3a29] font-bold"
                  suppressHydrationWarning
                >
                  {currentDate || "Carregando..."}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-[#d97706]" />
            </div>
          </div>
        </div>
      </header>

      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
        {/* Filtros */}
        <ReportFilters onFilterChange={handleFilterChange} />

        {/* Métricas do Mês Atual */}
        {monthlyReport && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-5 h-5 text-[#d97706]" />
              <h3 className="text-lg font-bold text-[#1e3a29] uppercase tracking-wide">
                Resumo Mensal - {monthlyReport.month}
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <MetricCard
                icon={<Milk size={24} />}
                iconColor="text-blue-600"
                iconBgColor="bg-blue-50"
                borderColor="border-[#1e3a29]"
                title="Produção Total"
                value={monthlyReport.totalProduction.toFixed(0)}
                unit="Litros"
              />

              <MetricCard
                icon={<Users size={24} />}
                iconColor="text-purple-600"
                iconBgColor="bg-purple-50"
                borderColor="border-[#1e3a29]"
                title="Produtores Ativos"
                value={monthlyReport.totalProducers}
                unit="Produtores"
              />

              <MetricCard
                icon={<TrendingUp size={24} />}
                iconColor="text-green-600"
                iconBgColor="bg-green-50"
                borderColor="border-[#d97706]"
                title="Média por Produtor"
                value={monthlyReport.averagePerProducer.toFixed(1)}
                unit="Litros"
              />

              <MetricCard
                icon={<Cat size={24} />}
                iconColor="text-amber-600"
                iconBgColor="bg-amber-50"
                borderColor="border-[#d97706]"
                title="Total de Animais"
                value={monthlyReport.totalAnimals}
                unit="Animais"
              />

              <MetricCard
                icon={<BarChart3 size={24} />}
                iconColor="text-indigo-600"
                iconBgColor="bg-indigo-50"
                borderColor="border-[#1e3a29]"
                title="Total de Coletas"
                value={monthlyReport.totalCollections}
                unit="Registros"
              />

              <MetricCard
                icon={<Milk size={24} />}
                iconColor="text-cyan-600"
                iconBgColor="bg-cyan-50"
                borderColor="border-[#d97706]"
                title="Média por Animal"
                value={monthlyReport.avgPerAnimal.toFixed(1)}
                unit="Litros"
              />
            </div>
          </section>
        )}

        {/* Ranking de Produtores */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-[#d97706]" />
            <h3 className="text-lg font-bold text-[#1e3a29] uppercase tracking-wide">
              Ranking de Produtores
            </h3>
          </div>

          <ProducerRankingTable data={ranking} />
        </section>
      </div>
    </>
  );
}
