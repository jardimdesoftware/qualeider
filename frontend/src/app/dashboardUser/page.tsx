"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import {
  Activity,
  BarChart3,
  ClipboardList,
  Dna,
  Milk,
  PawPrint,
  Ruler,
  ShieldCheck,
  TrendingUp,
  UserPlus,
  Users,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout";
import { DashboardLoading, PageHeader } from "@/components/dashboard";
import { EmptyState, ErrorModal, MetricCard } from "@/components/ui";
import { ICON_SIZES } from "@/constants/ui";
import { useUserDashboard } from "@/hooks/queries/useDashboard";
import { useRespondInvite } from "@/hooks/queries/useInvites";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { getUserRoleFromToken } from "@/utils/auth";

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

const adminActions = [
  {
    href: "/manageUsers",
    title: "Funcionários",
    description: "Gerencie permissões e acessos da equipe.",
    icon: Users,
  },
  {
    href: "/dashboardUser/breeds",
    title: "Raças",
    description: "Mantenha as classificações do rebanho atualizadas.",
    icon: Dna,
  },
  {
    href: "/dashboardUser/animalSpecies",
    title: "Tipos de animal",
    description: "Organize os tipos usados nos cadastros.",
    icon: PawPrint,
  },
  {
    href: "/manageMyAnimals/addAnimal",
    title: "Novo animal",
    description: "Cadastre rapidamente um animal no sistema.",
    icon: UserPlus,
  },
];

export default function DashboardUser() {
  const { userId, isLoading: isAuthLoading } = useAuthGuard("user");
  const [userPermRole, setUserPermRole] = useState<"ADMIN" | "VAQUEIRO" | null>(
    null,
  );

  const {
    animals,
    collections: dailyCollections,
    invites,
    isLoading: dataLoading,
  } = useUserDashboard(userId);
  const respondInvite = useRespondInvite();

  const [modalState, setModalState] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "success" as "success" | "error" | "info",
  });

  useEffect(() => {
    // Token is only available in the browser.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUserPermRole(getUserRoleFromToken());
  }, []);

  const isAdmin = userPermRole === "ADMIN";

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

  const lineChartData = useMemo(() => {
    const milkByDayLast7Days = dailyCollections
      .filter((collection: any) => {
        const collectionDate = new Date(collection.collectionDate);
        const today = new Date();
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(today.getDate() - 7);
        return collectionDate >= sevenDaysAgo && collectionDate <= today;
      })
      .reduce(
        (acc: Record<string, number>, collection: any) => {
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

    return Object.entries(milkByDayLast7Days).map(([date, quantity]) => ({
      date,
      quantity,
    }));
  }, [dailyCollections]);

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

  const pieChartData = useMemo(() => {
    const animalTypeDistribution = animals.reduce(
      (acc, animal) => {
        const key = animal.animalSpecies?.name ?? animal.animalType ?? "Outro";
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return Object.entries(animalTypeDistribution).map(([type, count]) => ({
      name: type,
      value: count,
    }));
  }, [animals]);

  const hasAnimals = animals.length > 0;
  const hasCollections = dailyCollections.length > 0;

  if (isAuthLoading || dataLoading) {
    return <DashboardLoading />;
  }

  return (
    <>
      <DashboardLayout>
        <PageHeader
          title={isAdmin ? "Painel do administrador" : "Painel de controle"}
          subtitle={
            isAdmin
              ? "Acompanhe a produção e gerencie os dados da propriedade."
              : "Acompanhe as coletas e a evolução do rebanho."
          }
        />

        <main className="mx-auto w-full max-w-7xl space-y-8 p-4 md:p-6 lg:p-8">
          {isAdmin && (
            <section className="campus-card overflow-hidden">
              <div className="border-b border-brand-border bg-white px-5 py-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-gov-blue" />
                  <h3 className="text-lg font-extrabold text-gray-950">
                    Gestão administrativa
                  </h3>
                </div>
                <p className="mt-1 text-sm text-brand-muted">
                  Acesso rápido às rotinas que exigem perfil de administrador.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 xl:grid-cols-4">
                {adminActions.map(({ href, title, description, icon: Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    className="rounded-md border border-brand-border bg-gray-50 p-4 transition hover:border-brand-primary hover:bg-brand-accent"
                  >
                    <Icon className="mb-3 h-6 w-6 text-brand-primary" />
                    <h4 className="font-bold text-gray-950">{title}</h4>
                    <p className="mt-1 text-sm text-brand-muted">
                      {description}
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {invites.length > 0 && (
            <section className="campus-card p-5">
              <h3 className="text-lg font-extrabold text-gray-950">
                Convites pendentes
              </h3>
              <div className="mt-4 space-y-3">
                {invites.map((invite) => (
                  <div
                    key={invite.id}
                    className="flex flex-col gap-3 rounded-md border border-brand-border bg-gray-50 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-semibold text-gray-950">
                        Convite da associação{" "}
                        <span className="text-brand-primary">
                          {invite.association?.name}
                        </span>
                      </p>
                      <p className="text-sm text-brand-muted">
                        {invite.message ||
                          "Gostaríamos que você fizesse parte da nossa associação."}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <button
                        onClick={() =>
                          handleInviteResponse(invite.token, "Decline")
                        }
                        className="flex-1 rounded-full border border-red-200 bg-white px-4 py-2 text-sm font-bold text-brand-secondary transition hover:bg-red-50 sm:flex-none"
                      >
                        Recusar
                      </button>
                      <button
                        onClick={() =>
                          handleInviteResponse(invite.token, "Accept")
                        }
                        className="flex-1 rounded-full bg-brand-primary px-4 py-2 text-sm font-bold text-white transition hover:bg-brand-primary-hover sm:flex-none"
                      >
                        Aceitar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {(!hasAnimals || !hasCollections) && (
            <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {!hasAnimals && (
                <EmptyState
                  icon={<PawPrint size={ICON_SIZES.XL} />}
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
            </section>
          )}

          <section>
            <div className="mb-4 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-brand-primary" />
              <h3 className="text-lg font-extrabold text-gray-950">
                Resumo do mês
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              <MetricCard
                icon={<PawPrint size={ICON_SIZES.MD} />}
                iconColor="text-brand-primary"
                iconBgColor="bg-brand-accent"
                title="Total de animais"
                value={totalAnimals}
              />

              <MetricCard
                icon={<Milk size={ICON_SIZES.MD} />}
                iconColor="text-gov-blue"
                iconBgColor="bg-blue-50"
                borderColor="border-gov-blue"
                title="Leite coletado"
                value={totalMilkThisMonth.toFixed(0)}
                unit="litros"
              />

              <MetricCard
                icon={<Ruler size={ICON_SIZES.MD} />}
                iconColor="text-brand-secondary"
                iconBgColor="bg-red-50"
                borderColor="border-brand-secondary"
                title="Idade média"
                value={averageAnimalAge.toFixed(1)}
                unit="anos"
              />

              <MetricCard
                icon={<TrendingUp size={ICON_SIZES.MD} />}
                iconColor="text-brand-primary"
                iconBgColor="bg-brand-accent"
                title="Média por animal"
                value={avgMilkPerAnimal.toFixed(1)}
                unit="L/animal"
              />

              <MetricCard
                icon={<Activity size={ICON_SIZES.MD} />}
                iconColor="text-brand-primary"
                iconBgColor="bg-brand-accent"
                title="Total de ordenhas"
                value={totalMilkingThisMonth}
                unit="realizadas"
              />

              <MetricCard
                icon={<ClipboardList size={ICON_SIZES.MD} />}
                iconColor="text-gov-blue"
                iconBgColor="bg-blue-50"
                borderColor="border-gov-blue"
                title="Coletas no mês"
                value={totalCollectionsThisMonth}
                unit="registros"
              />
            </div>
          </section>

          <section className="grid grid-cols-1 items-start gap-5 xl:grid-cols-2">
            <AnimalDistributionChart data={pieChartData} />
            <MilkLast7DaysChart data={lineChartData} />
          </section>
        </main>
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
