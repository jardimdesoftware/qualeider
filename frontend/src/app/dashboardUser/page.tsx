"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout";
import { EmptyState, ErrorModal } from "@/components/ui";
import { Milk, Cat, CheckCircle2, Clock, Users, BarChart3 } from "lucide-react";
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
const AnimalProductionBarChart = dynamic(
  () => import("@/components/dashboard/AnimalProductionBarChart"),
  {
    ssr: false,
    loading: () => (
      <p className="text-center py-10 text-slate-400">Carregando gráfico...</p>
    ),
  },
);
import HerdSummaryStrip from "@/components/dashboard/HerdSummaryStrip";
import HerdGrid from "@/components/dashboard/HerdGrid";
import DashboardLoading from "@/components/dashboard/DashboardLoading";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useUser } from "@/hooks/useUser";
import { ICON_SIZES } from "@/constants/ui";
import { useUserDashboard } from "@/hooks/queries/useDashboard";
import { useRespondInvite } from "@/hooks/queries/useInvites";
import { useUsers } from "@/hooks/queries/useUsers";
import { animalService } from "@/services/animalService";
import { AnimalProductionSummary } from "@/interfaces/animal";
import { Status } from "@/interfaces/user";

function greetingForHour(hour: number): string {
  if (hour < 6) return "Boa madrugada";
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

export default function DashboardUser() {
  const router = useRouter();
  const { userId, isLoading: isAuthLoading } = useAuthGuard();
  const { data: user } = useUser();
  const isAdmin = user?.role === "ADMIN";

  const { data: teamUsers = [] } = useUsers({ enabled: isAdmin });
  // O JWT não carrega o nome: busca na lista de usuários, com o e-mail como reserva.
  const displayName =
    user?.name ??
    teamUsers.find((u) => String(u.id) === String(user?.sub))?.name ??
    user?.email?.split("@")[0];
  const firstName = displayName?.trim().split(/\s+/)[0];
  const activeEmployees = useMemo(
    () => teamUsers.filter((u) => u.status === Status.Active).length,
    [teamUsers],
  );

  const {
    animals,
    collections: dailyCollections,
    invites,
    isLoading: dataLoading,
  } = useUserDashboard(userId);
  const respondInvite = useRespondInvite();

  const [animalProduction, setAnimalProduction] = useState<
    AnimalProductionSummary[]
  >([]);

  useEffect(() => {
    if (!userId) return;
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    animalService
      .getProductionSummary(start.toISOString(), today.toISOString())
      .then(setAnimalProduction)
      .catch((err) => console.error("Erro ao buscar produção por animal", err));
  }, [userId]);

  const productionByAnimalId = useMemo(() => {
    const map = new Map<number, AnimalProductionSummary>();
    animalProduction.forEach((p) => map.set(p.animalId, p));
    return map;
  }, [animalProduction]);

  // Modal states
  const [modalState, setModalState] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "success" as "success" | "error" | "info",
  });

  const handleInviteResponse = async (
    token: string,
    response: "Accept" | "Decline",
  ) => {
    try {
      const result = await respondInvite.mutateAsync({ token, response });
      if (response === "Accept") {
        setModalState({
          isOpen: true,
          title: "Bem-vindo!",
          message: result.message || "Você agora faz parte da associação.",
          type: "success",
        });
      }
    } catch (err: any) {
      console.error("Erro ao responder convite", err);
      setModalState({
        isOpen: true,
        title: "Erro",
        message:
          "Erro ao processar resposta: " +
          (err.response?.data?.message || err.message),
        type: "error",
      });
    }
  };

  const handleCloseModal = () => {
    setModalState((prev) => ({ ...prev, isOpen: false }));
    if (modalState.type === "success") {
      window.location.reload();
    }
  };

  const totalAnimals = useMemo(() => animals.length, [animals.length]);

  const [currentDate, setCurrentDate] = useState<string>("");
  const [greeting, setGreeting] = useState<string>("");

  useEffect(() => {
    const now = new Date();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- so calcula no client pra evitar mismatch de hidratacao (data/hora dependem do fuso do navegador)
    setCurrentDate(
      now.toLocaleDateString("pt-BR", {
        weekday: "long",
        day: "2-digit",
        month: "long",
      }),
    );
    setGreeting(greetingForHour(now.getHours()));
  }, []);

  const hasCollectedToday = useMemo(() => {
    const today = new Date();
    return dailyCollections.some((collection) => {
      const d = new Date(collection.collectionDate);
      return (
        d.getDate() === today.getDate() &&
        d.getMonth() === today.getMonth() &&
        d.getFullYear() === today.getFullYear()
      );
    });
  }, [dailyCollections]);

  // Filtra as coleções do mês atual
  const thisMonthCollections = useMemo(() => {
    const today = new Date();
    return dailyCollections.filter((collection) => {
      const collectionDate = new Date(collection.collectionDate);
      return (
        collectionDate.getMonth() === today.getMonth() &&
        collectionDate.getFullYear() === today.getFullYear()
      );
    });
  }, [dailyCollections]);

  // Dados para o gráfico histórico (últimos 7 dias)
  const lineChartData = useMemo(() => {
    const milkByDayLast7Days = dailyCollections
      .filter((collection: any) => {
        const collectionDate = new Date(collection.collectionDate);
        const t = new Date();
        const sevenDaysAgo = new Date(t);
        sevenDaysAgo.setDate(t.getDate() - 7);
        return collectionDate >= sevenDaysAgo && collectionDate <= t;
      })
      .reduce(
        (acc: any, collection: any) => {
          const date = new Date(collection.collectionDate).toLocaleDateString(
            "pt-BR",
            {
              day: "2-digit",
              month: "2-digit",
            },
          );
          acc[date] = (acc[date] || 0) + collection.quantity;
          return acc;
        },
        {} as Record<string, number>,
      );

    return (Object.entries(milkByDayLast7Days) as [string, number][]).map(
      ([date, quantity]) => ({
        date,
        quantity,
      }),
    );
  }, [dailyCollections]);

  // --- MÉTRICAS REVISADAS (Usando thisMonthCollections ao invés de dailyCollections) ---

  const totalMilkThisMonth = useMemo(
    () =>
      thisMonthCollections.reduce(
        (sum, collection) => sum + collection.quantity,
        0,
      ),
    [thisMonthCollections],
  );

  const totalMilkingThisMonth = useMemo(
    () =>
      thisMonthCollections.reduce(
        (sum, collection) => sum + collection.numOrdens,
        0,
      ),
    [thisMonthCollections],
  );

  const averageAnimalAge = useMemo(
    () =>
      animals.length > 0
        ? animals.reduce((sum, animal) => sum + animal.age, 0) / animals.length
        : 0,
    [animals],
  );

  const avgMilkPerAnimal = useMemo(
    () =>
      animals.length > 0 && totalMilkThisMonth > 0
        ? totalMilkThisMonth / animals.length
        : 0,
    [totalMilkThisMonth, animals.length],
  );

  const totalCollectionsThisMonth = useMemo(
    () => thisMonthCollections.length,
    [thisMonthCollections],
  );

  const breedDistribution = useMemo(() => {
    const byBreed = animals.reduce(
      (acc, animal) => {
        const key = animal.breed || animal.animalSpecies?.name || "Outro";
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return Object.entries(byBreed).map(([breed, count]) => ({
      name: breed,
      value: count,
    }));
  }, [animals]);

  const animalProductionChartData = useMemo(
    () =>
      animals.map((animal) => ({
        name: animal.name || `#${animal.tagNumber ?? animal.id}`,
        total: productionByAnimalId.get(animal.id)?.totalProduction ?? 0,
      })),
    [animals, productionByAnimalId],
  );

  const topAnimalId = useMemo(() => {
    if (animalProduction.length === 0) return null;
    const top = animalProduction.reduce((best, current) =>
      current.totalProduction > best.totalProduction ? current : best,
    );
    return top.totalProduction > 0 ? top.animalId : null;
  }, [animalProduction]);

  const hasAnimals = animals.length > 0;
  const hasCollections = dailyCollections.length > 0;

  if (isAuthLoading || dataLoading) {
    return <DashboardLoading />;
  }

  return (
    <>
      <DashboardLayout>
        {/* Hero: saudação pessoal, no lugar do PageHeader genérico.
            Admin/produtor não faz coleta — a ação principal dele é gerenciar
            a operação (funcionários/relatórios), não "Registrar coleta". */}
        <header className="shrink-0 bg-gradient-to-br from-white to-[#f3f9f0] border-b border-slate-200 px-4 md:px-8 py-4">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5">
            <div>
              <p
                className="text-sm font-semibold text-slate-500 mb-1"
                suppressHydrationWarning
              >
                {greeting || "Olá"}
                {currentDate ? ` · ${currentDate}` : ""}
              </p>
              <h1 className="text-3xl md:text-4xl font-black text-slate-900">
                {firstName ? `Olá, ${firstName}` : "Olá!"}
              </h1>
            </div>

            {isAdmin ? (
              <div className="flex flex-wrap items-center gap-2.5">
                <Link
                  href="/manageUsers"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-slate-700 bg-white border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all"
                >
                  <Users size={ICON_SIZES.XS} />
                  Funcionários
                  {activeEmployees > 0 && (
                    <span className="text-slate-400 font-normal">
                      · {activeEmployees} ativos
                    </span>
                  )}
                </Link>
                <Link
                  href="/dashboardUser/reports"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white bg-brand-primary hover:bg-brand-primary-hover transition-colors shadow-sm"
                >
                  <BarChart3 size={ICON_SIZES.XS} />
                  Ver relatórios
                </Link>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-3">
                {hasCollections && (
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold border ${
                      hasCollectedToday
                        ? "bg-green-50 text-green-700 border-green-200"
                        : "bg-amber-50 text-amber-700 border-amber-200"
                    }`}
                  >
                    {hasCollectedToday ? (
                      <CheckCircle2 size={ICON_SIZES.XS} />
                    ) : (
                      <Clock size={ICON_SIZES.XS} />
                    )}
                    {hasCollectedToday
                      ? "Coleta de hoje registrada"
                      : "Coleta de hoje pendente"}
                  </span>
                )}
                <Link
                  href="/dailyForm"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white bg-brand-primary hover:bg-brand-primary-hover transition-colors shadow-sm"
                >
                  <Milk size={ICON_SIZES.XS} />
                  Registrar coleta
                </Link>
              </div>
            )}
          </div>
        </header>

        <div className="w-full flex-1 bg-slate-50 p-4 md:p-6 lg:p-8 space-y-6">
          {/* Pending Invites Section */}
          {invites.length > 0 && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <h3 className="text-lg font-bold text-slate-800 mb-4">
                Convites Pendentes
              </h3>
              <div className="space-y-4">
                {invites.map((invite) => (
                  <div
                    key={invite.id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200"
                  >
                    <div>
                      <p className="font-semibold text-slate-800">
                        Convite da Associação{" "}
                        <span className="text-slate-800">
                          {invite.association?.name}
                        </span>
                      </p>
                      <p className="text-sm text-slate-600">
                        {invite.message ||
                          "Gostaríamos que você fizesse parte da nossa associação."}
                      </p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() =>
                          handleInviteResponse(invite.token, "Decline")
                        }
                        className="flex-1 sm:flex-none px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                      >
                        Recusar
                      </button>
                      <button
                        onClick={() =>
                          handleInviteResponse(invite.token, "Accept")
                        }
                        className="flex-1 sm:flex-none px-4 py-2 text-sm font-medium text-white bg-[#2f9e41] hover:bg-[#142920] rounded-lg transition-colors shadow-sm"
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
                  description={
                    isAdmin
                      ? "Assim que um funcionário registrar a primeira coleta, o histórico aparece aqui."
                      : "Registre sua primeira coleta para visualizar o histórico."
                  }
                  actionHref={isAdmin ? "/manageUsers" : "/dailyForm"}
                  actionLabel={
                    isAdmin ? "Gerenciar funcionários" : "Registrar coleta"
                  }
                />
              )}
            </div>
          )}

          {/* Resumo do mês — faixa fina, não cartões repetidos */}
          <HerdSummaryStrip
            items={[
              {
                label: "litros de leite no mês",
                value: totalMilkThisMonth.toFixed(0),
                primary: true,
              },
              { label: "animais", value: totalAnimals },
              { label: "L/animal", value: avgMilkPerAnimal.toFixed(1) },
              { label: "ordenhas", value: totalMilkingThisMonth },
              { label: "coletas no mês", value: totalCollectionsThisMonth },
              {
                label: "anos (idade média)",
                value: averageAnimalAge.toFixed(1),
              },
              ...(isAdmin
                ? [{ label: "funcionários ativos", value: activeEmployees }]
                : []),
            ]}
          />

          {/* Gráficos — tendência em destaque no topo, comparativos abaixo */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
            <MilkLast7DaysChart
              data={lineChartData}
              showEmptyAction={!isAdmin}
              emptyDescription={
                isAdmin
                  ? "Nenhuma coleta registrada nos últimos 7 dias."
                  : "Registre coletas para ver o gráfico."
              }
            />
            <AnimalProductionBarChart data={animalProductionChartData} />
            <AnimalDistributionChart
              data={breedDistribution}
              title="Composição por Raça"
              subtitle="Raças presentes no rebanho"
              unitLabel="animais"
            />
          </section>

          {/* Seu rebanho */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-800">Seu rebanho</h3>
              <span className="text-sm text-slate-400">
                {totalAnimals} vaca{totalAnimals !== 1 ? "s" : ""} ativa
                {totalAnimals !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="max-h-72 overflow-y-auto pr-1 pt-2">
              <HerdGrid
                animals={animals}
                productionByAnimalId={productionByAnimalId}
                topAnimalId={topAnimalId}
              />
            </div>
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
