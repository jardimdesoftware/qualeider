"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Save } from "lucide-react";
import { DashboardLayout } from "@/components/layout";
import { PageHeader } from "@/components/dashboard";
import { StickyTotalsBar } from "@/components/dailyForm";
import { ErrorModal } from "@/components/ui";
import DashboardLoading from "@/components/dashboard/DashboardLoading";
import { MilkingPlace } from "@/interfaces/daily-collection";
import { DailyCollectionData, dailyCollectionSchema } from "@/schemas/collection";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useDailyCollection } from "@/hooks/useDailyCollection";
import { useUserAnimals } from "@/hooks/queries/useAnimals";
import { useCreateCollection } from "@/hooks/queries/useCollections";
import { getLocalDate, formatDateLongBR } from "@/utils/date";
import { getFriendlyErrorMessage } from "@/utils/errorMessage";
import AnimalCollectionCard from "./_components/AnimalCollectionCard";
import { CollectionSummaryModal } from "./_components/CollectionSummaryModal";

export default function DailyForm() {
  const router = useRouter();
  const { userId, isLoading: isAuthLoading } = useAuthGuard("user");
  const { validateCollectionItems, transformProductionMapToItems } = useDailyCollection();

  const { data: animals = [], isLoading: isLoadingAnimals } = useUserAnimals(userId);
  const createCollection = useCreateCollection();
  
  const [productionMap, setProductionMap] = useState<Record<number, string>>({});
  const [isFinalizing, setIsFinalizing] = useState(false);

  const [modalState, setModalState] = useState({
    isOpen: false,
    type: "success" as "success" | "error" | "info",
    message: "",
  });

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<DailyCollectionData>({
    resolver: zodResolver(dailyCollectionSchema),
    mode: "onBlur",
    defaultValues: {
      quantity: 0,
      numAnimals: 0,
      numOrdens: 0,
      rationProvided: false,
      numLactation: 0,
      milkingPlace: MilkingPlace.Aberto,
      technicalAssistance: false,
      collectionDate: getLocalDate(),
    },
  });

  const totals = useMemo(() => {

    let totalMilk = 0;
    let milkedCows = 0;

    Object.values(productionMap).forEach((val) => {
      const num = parseFloat(val);
      if (!isNaN(num) && num > 0) {
        totalMilk += num;
        milkedCows++;
      }
    });

    return { totalMilk, milkedCows };
  }, [productionMap]);

  useEffect(() => {
    setValue("quantity", totals.totalMilk);
    setValue("numAnimals", totals.milkedCows);
  }, [totals, setValue]);

  const handleProductionChange = (animalId: number, val: string) => {
    setProductionMap((prev) => ({ ...prev, [animalId]: val }));
  };

  const onFinalSubmit = async (data: DailyCollectionData) => {
    if (!userId) return;

    try {
      const items = transformProductionMapToItems(productionMap);
      const validation = validateCollectionItems(items);

      if (!validation.isValid) {
        setModalState({
          isOpen: true,
          type: "error",
          message: validation.errors[0].message,
        });
        setIsFinalizing(false);
        return;
      }

      const payload = { ...data, items };

      await createCollection.mutateAsync({ data: payload, userId });

      setModalState({
        isOpen: true,
        type: "success",
        message: "Coleta registrada com sucesso!",
      });
    } catch (err) {
      console.error(err);
      setModalState({
        isOpen: true,
        type: "error",
        message: getFriendlyErrorMessage(err),
      });
    }
  };

  const [displayDate, setDisplayDate] = useState<string>("");

  useEffect(() => {
    setDisplayDate(formatDateLongBR(new Date()));
  }, []);

  if (isAuthLoading || isLoadingAnimals) {
    return <DashboardLoading />;
  }

  return (
    <>
      <DashboardLayout>
        <PageHeader
          title="Registrar Coleta Diária"
          subtitle="Informe os dados da coleta de hoje"
        />
        
        <StickyTotalsBar
          totalMilk={totals.totalMilk}
          milkedCows={totals.milkedCows}
          totalAnimals={animals.length}
        />

      <div className="flex-1 overflow-y-auto pb-24 md:pb-0">
        
        {/* Animal List */}
        <div className="p-4 space-y-4 max-w-2xl mx-auto">
          {animals.length === 0 ? (
            <div className="text-center text-slate-500 py-10">
              Nenhum animal cadastrado. Adicione animais para registrar a coleta.
            </div>
          ) : (
            animals.map((animal) => (
              <AnimalCollectionCard
                key={animal.id}
                animal={animal}
                value={productionMap[animal.id] || ""}
                onChange={(val) => handleProductionChange(animal.id, val)}
                disabled={isSubmitting}
              />
            ))
          )}
        </div>

        {/* Floating Save Button */}
        <div className="fixed bottom-6 left-0 w-full px-4 z-30 lg:left-64 lg:w-[calc(100%-16rem)] flex justify-center pointer-events-none">
          <button
            type="button"
            onClick={() => setIsFinalizing(true)}
            className="w-full max-w-md bg-[#d97706] hover:bg-[#b45309] text-white p-4 rounded-xl shadow-xl font-bold text-lg flex justify-center items-center gap-2 transform active:scale-95 transition-all pointer-events-auto"
            aria-label="Finalizar e salvar coleta"
          >
            <Save className="w-6 h-6" />
            Finalizar Coleta
          </button>
        </div>
      </div>

      <CollectionSummaryModal
        isOpen={isFinalizing}
        onClose={() => setIsFinalizing(false)}
        onSubmit={handleSubmit(onFinalSubmit)}
        totals={totals}
        register={register}
        errors={errors}
        isSubmitting={isSubmitting}
      />
    </DashboardLayout>

    <ErrorModal
      isOpen={modalState.isOpen}
      onClose={() => {
        setModalState(prev => ({ ...prev, isOpen: false }));
        if (modalState.type === "success") {
          router.push("/dashboardUser");
        }
      }}
      title={modalState.type === "success" ? "Sucesso!" : "Atenção"}
      message={modalState.message}
      type={modalState.type}
    />
    </>
  );
}
