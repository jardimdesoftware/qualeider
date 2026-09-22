"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout";
import { PageHeader } from "@/components/dashboard";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useRoleGuard } from "@/hooks/useRoleGuard";
import { reportService } from "@/services/reportService";
import { animalService } from "@/services/animalService";
import { MonthlyReport } from "@/interfaces/report";
import { AnimalProductionSummary } from "@/interfaces/animal";
import ReportFilters from "@/components/reports/ReportFilters";
import AnimalProductionTable from "@/components/reports/AnimalProductionTable";
import ReportExportButton from "@/components/reports/ReportExportButton";
import HerdSummaryStrip from "@/components/dashboard/HerdSummaryStrip";
import AnimalProductionBarChart from "@/components/dashboard/AnimalProductionBarChart";
import DashboardLoading from "@/components/dashboard/DashboardLoading";

export default function ReportsPage() {
  useAuthGuard();
  const { isChecking } = useRoleGuard(["ADMIN"]);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [animalProduction, setAnimalProduction] = useState<
    AnimalProductionSummary[]
  >([]);
  const [monthlyReport, setMonthlyReport] = useState<MonthlyReport | null>(
    null,
  );

  const fetchReports = async (startDate?: string, endDate?: string) => {
    setLoading(true);
    try {
      const [productionData, monthlyData] = await Promise.all([
        animalService.getProductionSummary(startDate, endDate),
        reportService.getCurrentMonthReport(),
      ]);

      setAnimalProduction(productionData);
      setMonthlyReport(monthlyData);
    } catch (error) {
      console.error("Erro ao buscar relatórios:", error);

      if (error instanceof Error && error.message.includes("401")) {
        router.push("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- busca dados via API e atualiza estado com o resultado
    fetchReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- roda so uma vez no mount, fetchReports nao e memoizada
  }, []);

  const handleFilterChange = (
    startDate: string | null,
    endDate: string | null,
  ) => {
    if (startDate && endDate) {
      fetchReports(startDate, endDate);
    }
  };

  if (isChecking || loading) return <DashboardLoading />;

  return (
    <DashboardLayout>
      <PageHeader
        title="Relatórios"
        subtitle="Acompanhe o desempenho e as estatísticas da produção"
        actions={
          <ReportExportButton
            animalProduction={animalProduction}
            monthlyReport={monthlyReport}
          />
        }
      />

      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
        {monthlyReport && (
          <section>
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-3">
              Resumo Mensal &mdash; {monthlyReport.month}
            </h3>
            <HerdSummaryStrip
              items={[
                {
                  label: "litros de leite no mês",
                  value: monthlyReport.totalProduction.toFixed(0),
                  primary: true,
                },
                { label: "animais", value: monthlyReport.totalAnimals },
                { label: "coletas", value: monthlyReport.totalCollections },
                {
                  label: "L/animal",
                  value: monthlyReport.avgPerAnimal.toFixed(1),
                },
              ]}
            />
          </section>
        )}

        <section className="space-y-4">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide">
            Produção por animal
          </h3>
          <ReportFilters onFilterChange={handleFilterChange} />
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 items-start">
            <div className="lg:col-span-2">
              <AnimalProductionBarChart
                data={animalProduction.map((a) => ({
                  name: a.name || `#${a.tagNumber ?? a.animalId}`,
                  total: a.totalProduction,
                }))}
              />
            </div>
            <div className="lg:col-span-3">
              <AnimalProductionTable data={animalProduction} />
            </div>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
