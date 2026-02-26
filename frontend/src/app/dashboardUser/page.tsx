"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout";
import { PageHeader } from "@/components/dashboard";
import { MetricCard, EmptyState, ErrorModal } from "@/components/ui";
import { Activity, Milk, Cat, Ruler, Wheat, Droplet, BarChart3 } from "lucide-react";
import dynamic from "next/dynamic";
const AnimalDistributionChart = dynamic(() => import("@/components/dashboard/AnimalDistributionChart"), { ssr: false, loading: () => <p className="text-center py-10 text-slate-400">Carregando gráfico...</p> });
const MilkLast7DaysChart = dynamic(() => import("@/components/dashboard/MilkLast7DaysChart"), { ssr: false, loading: () => <p className="text-center py-10 text-slate-400">Carregando gráfico...</p> });
import DashboardLoading from "@/components/dashboard/DashboardLoading";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { ICON_SIZES } from "@/constants/ui";
import { useUserDashboard } from "@/hooks/queries/useDashboard";
import { useRespondInvite } from "@/hooks/queries/useInvites";


export default function DashboardUser() {
  const router = useRouter();
  const { userId, isLoading: isAuthLoading } = useAuthGuard("user");
  
  const { animals, collections: dailyCollections, invites, isLoading: dataLoading } = useUserDashboard(userId);
  const respondInvite = useRespondInvite();
  
  // Modal states
  const [modalState, setModalState] = useState({
      isOpen: false,
      title: "",
      message: "",
      type: "success" as "success" | "error" | "info"
  });

  const handleInviteResponse = async (token: string, response: 'Accept' | 'Decline') => {
      try {
          const result = await respondInvite.mutateAsync({ token, response });
          if (response === 'Accept') {
              setModalState({
                  isOpen: true,
                  title: "Bem-vindo!",
                  message: result.message || "Você agora faz parte da associação.",
                  type: "success"
              });
          }
      } catch (err: any) {
          console.error("Erro ao responder convite", err);
          setModalState({
              isOpen: true,
              title: "Erro",
              message: "Erro ao processar resposta: " + (err.response?.data?.message || err.message),
              type: "error"
          });
      }
  };

  const handleCloseModal = () => {

      setModalState(prev => ({ ...prev, isOpen: false }));
      if (modalState.type === 'success') {
          window.location.reload();
      }
  };

  const totalAnimals = useMemo(() => animals.length, [animals.length]);

  const [thisMonthCollections, setThisMonthCollections] = useState<any[]>([]);
  const [totalMilkThisMonth, setTotalMilkThisMonth] = useState(0);
  const [totalMilkingThisMonth, setTotalMilkingThisMonth] = useState(0);
  const [lineChartData, setLineChartData] = useState<any[]>([]);

  useEffect(() => {
    if (dailyCollections.length > 0) {
      const today = new Date();
      const filtered = dailyCollections.filter((collection) => {
        const collectionDate = new Date(collection.collectionDate);
        return (
          collectionDate.getMonth() === today.getMonth() &&
          collectionDate.getFullYear() === today.getFullYear()
        );
      });
      setThisMonthCollections(filtered);
      setTotalMilkThisMonth(filtered.reduce((sum, collection) => sum + collection.quantity, 0));
      setTotalMilkingThisMonth(filtered.reduce((sum, collection) => sum + collection.numOrdens, 0));

      const milkByDayLast7Days = dailyCollections
        .filter((collection: any) => {
          const collectionDate = new Date(collection.collectionDate);
          const t = new Date();
          const sevenDaysAgo = new Date(t);
          sevenDaysAgo.setDate(t.getDate() - 7);
          return collectionDate >= sevenDaysAgo && collectionDate <= t;
        })
        .reduce((acc: any, collection: any) => {
          const date = new Date(collection.collectionDate).toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
          });
          acc[date] = (acc[date] || 0) + collection.quantity;
          return acc;
        }, {} as Record<string, number>);

      setLineChartData(Object.entries(milkByDayLast7Days).map(([date, quantity]) => ({
        date,
        quantity,
      })));
    }
  }, [dailyCollections]);

  const averageAnimalAge = useMemo(() =>
    animals.length > 0
      ? animals.reduce((sum, animal) => sum + animal.age, 0) / animals.length
      : 0,
    [animals]
  );

  const rationProvidedPercentage = useMemo(() =>
    dailyCollections.length > 0
      ? (dailyCollections.filter((collection) => collection.rationProvided).length /
          dailyCollections.length) *
        100
      : 0,
    [dailyCollections]
  );

  const averageLactationsThisMonth = useMemo(() =>
    dailyCollections.length > 0
      ? dailyCollections.reduce((sum, collection) => sum + collection.numLactation, 0) /
        dailyCollections.length
      : 0,
    [dailyCollections]
  );

  const pieChartData = useMemo(() => {
    const animalTypeDistribution = animals.reduce((acc, animal) => {
      acc[animal.animalType] = (acc[animal.animalType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(animalTypeDistribution).map(([type, count]) => ({
      name: type,
      value: count,
    }));
  }, [animals]);

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

  const hasAnimals = animals.length > 0;
  const hasCollections = dailyCollections.length > 0;

  if (isAuthLoading || dataLoading) {
    return <DashboardLoading />;
  }

  return (
    <>
      <DashboardLayout>
        <PageHeader
          title="Painel de Controle"
          subtitle="Bem-vindo de volta!"
        />

        <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
            
          {/* Pending Invites Section */}
          {invites.length > 0 && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="text-lg font-bold text-[#1e3a29] mb-4">Convites Pendentes</h3>
                <div className="space-y-4">
                    {invites.map((invite) => (
                        <div key={invite.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                            <div>
                                <p className="font-semibold text-slate-800">
                                    Convite da Associação <span className="text-[#1e3a29]">{invite.association?.name}</span>
                                </p>
                                <p className="text-sm text-slate-600">{invite.message || "Gostaríamos que você fizesse parte da nossa associação."}</p>
                            </div>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => handleInviteResponse(invite.token, 'Decline')}
                                    className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                                >
                                    Recusar
                                </button>
                                <button 
                                    onClick={() => handleInviteResponse(invite.token, 'Accept')}
                                    className="px-4 py-2 text-sm font-medium text-white bg-[#1e3a29] hover:bg-[#142920] rounded-lg transition-colors shadow-sm"
                                >
                                    Aceitar
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
          )}

          {/* Empty States */}
          {(!hasAnimals || !hasCollections) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {!hasAnimals && (
                <EmptyState
                  icon={<Cat size={ICON_SIZES.XL} />}
                  title="Nenhum animal cadastrado"
                  description="Cadastre seu primeiro animal para ver métricas e gráficos."
                  actionHref="/manageMyAnimals"
                  actionLabel="Cadastrar animal"
                />
              )}
              {!hasCollections && (
                <EmptyState
                  icon={<Milk size={ICON_SIZES.XL} />}
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
                icon={<Cat size={ICON_SIZES.MD} />}
                iconColor="text-green-600"
                iconBgColor="bg-green-50"
                borderColor="border-[#1e3a29]"
                title="Total de Animais"
                value={totalAnimals}
              />

              <MetricCard
                icon={<Milk size={ICON_SIZES.MD} />}
                iconColor="text-blue-600"
                iconBgColor="bg-blue-50"
                borderColor="border-[#1e3a29]"
                title="Leite Coletado"
                value={totalMilkThisMonth.toFixed(0)}
                unit="Litros"
              />

              <MetricCard
                icon={<Ruler size={ICON_SIZES.MD} />}
                iconColor="text-purple-600"
                iconBgColor="bg-purple-50"
                borderColor="border-[#d97706]"
                title="Idade Média"
                value={averageAnimalAge.toFixed(1)}
                unit="anos"
              />

              <MetricCard
                icon={<Wheat size={ICON_SIZES.MD} />}
                iconColor="text-amber-600"
                iconBgColor="bg-amber-50"
                borderColor="border-[#d97706]"
                title="Ração Fornecida"
                value={`${rationProvidedPercentage.toFixed(0)}%`}
                trend="das coletas"
              />

              <MetricCard
                icon={<Activity size={ICON_SIZES.MD} />}
                iconColor="text-green-700"
                iconBgColor="bg-green-50"
                borderColor="border-[#1e3a29]"
                title="Total Ordenhas"
                value={totalMilkingThisMonth}
                unit="Realizadas"
              />

              <MetricCard
                icon={<Droplet size={ICON_SIZES.MD} />}
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
      
      <ErrorModal
        isOpen={modalState.isOpen}
        onClose={handleCloseModal}
        title={modalState.title}
        message={modalState.message}
        type={modalState.type}
      />
    </>
  );
}
