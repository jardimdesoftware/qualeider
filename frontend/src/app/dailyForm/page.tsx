"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Save, Search, ChevronDown, ChevronUp, Check, Milk, Loader2 } from "lucide-react";
import { DashboardLayout } from "@/components/layout";
import { PageHeader } from "@/components/dashboard";
import { ErrorModal } from "@/components/ui";
import DashboardLoading from "@/components/dashboard/DashboardLoading";
import { MilkingPlace } from "@/interfaces/daily-collection";
import { CollectionItem } from "@/schemas/collection";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useDailyCollection, ConfirmedItemMap } from "@/hooks/useDailyCollection";
import { useUserAnimals } from "@/hooks/queries/useAnimals";
import { useCreateCollection } from "@/hooks/queries/useCollections";
import { getLocalDate, formatDateLongBR } from "@/utils/date";
import { getFriendlyErrorMessage } from "@/utils/errorMessage";
import { Status, Animal } from "@/interfaces/animal";
import { ActiveCowForm } from "./_components/ActiveCowForm";
import { ConfirmedCowsList } from "./_components/ConfirmedCowsList";

function animalLabel(a: Animal): string {
  const tag = a.tagNumber ? `#${a.tagNumber}` : null;
  const name = a.name ?? null;
  if (tag && name) return `${tag} - ${name}`;
  if (tag) return tag;
  if (name) return name;
  return `Animal #${a.id}`;
}

export default function DailyForm() {
  const router = useRouter();
  const { userId, isLoading: isAuthLoading } = useAuthGuard("user");
  const { validateCollectionItems, transformConfirmedItemsToPayload } = useDailyCollection();

  const { data: animals = [], isLoading: isLoadingAnimals } = useUserAnimals(userId);
  const createCollection = useCreateCollection();

  const [confirmedItems, setConfirmedItems] = useState<ConfirmedItemMap>({});
  const [selectedAnimalId, setSelectedAnimalId] = useState<number | null>(null);
  const [activeQuantity, setActiveQuantity] = useState("");
  const [activeCmtResult, setActiveCmtResult] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [displayDate, setDisplayDate] = useState("");
  const [modalState, setModalState] = useState({
    isOpen: false,
    type: "success" as "success" | "error" | "info",
    message: "",
  });

  useEffect(() => { setDisplayDate(formatDateLongBR(new Date())); }, []);

  const activeAnimals = useMemo(
    () => animals.filter((a) => a.status === Status.Active),
    [animals]
  );

  const unconfirmedAnimals = useMemo(
    () => activeAnimals.filter((a) => !confirmedItems[a.id]),
    [activeAnimals, confirmedItems]
  );

  const filteredDropdown = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return unconfirmedAnimals;
    return unconfirmedAnimals.filter(
      (a) =>
        a.name?.toLowerCase().includes(q) ||
        a.tagNumber?.toLowerCase().includes(q)
    );
  }, [unconfirmedAnimals, searchQuery]);

  const selectedAnimal = useMemo(
    () => animals.find((a) => a.id === selectedAnimalId) ?? null,
    [animals, selectedAnimalId]
  );

  const totals = useMemo(() => {
    const items = Object.values(confirmedItems);
    const totalMilk = items.reduce((s, i) => s + i.quantity, 0);
    return { totalMilk, milkedCows: items.length };
  }, [confirmedItems]);

  const handleSelectAnimal = (animal: Animal) => {
    setSelectedAnimalId(animal.id);
    setActiveQuantity("");
    setActiveCmtResult(null);
    setDropdownOpen(false);
    setSearchQuery("");
  };

  const handleConfirmCow = () => {
    if (!selectedAnimalId) return;
    const qty = parseFloat(activeQuantity.replace(",", "."));
    if (!qty || qty <= 0) return;
    setConfirmedItems((prev) => ({
      ...prev,
      [selectedAnimalId]: { quantity: qty, cmtResult: activeCmtResult },
    }));
    setSelectedAnimalId(null);
    setActiveQuantity("");
    setActiveCmtResult(null);
  };

  const handleEditConfirmed = (animalId: number) => {
    const item = confirmedItems[animalId];
    if (!item) return;
    setSelectedAnimalId(animalId);
    setActiveQuantity(String(item.quantity));
    setActiveCmtResult(item.cmtResult ?? null);
    setConfirmedItems((prev) => {
      const next = { ...prev };
      delete next[animalId];
      return next;
    });
  };

  const handleFinalize = async () => {
    if (!userId || isSubmitting) return;
    const items: CollectionItem[] = transformConfirmedItemsToPayload(confirmedItems);
    const validation = validateCollectionItems(items);
    if (!validation.isValid) {
      setModalState({ isOpen: true, type: "error", message: validation.errors[0].message });
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = {
        collectionDate: getLocalDate(),
        quantity: totals.totalMilk,
        numAnimals: totals.milkedCows,
        numOrdens: 1,
        numLactation: totals.milkedCows,
        rationProvided: false,
        technicalAssistance: false,
        milkingPlace: MilkingPlace.Curral,
        items,
      };
      await createCollection.mutateAsync({ data: payload, userId });
      setModalState({ isOpen: true, type: "success", message: "Coleta registrada com sucesso!" });
    } catch (err) {
      console.error(err);
      setModalState({ isOpen: true, type: "error", message: getFriendlyErrorMessage(err) });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isAuthLoading || isLoadingAnimals) return <DashboardLoading />;

  const totalActive = activeAnimals.length;
  const progress = totalActive > 0 ? (totals.milkedCows / totalActive) * 100 : 0;

  return (
    <>
      <DashboardLayout>
        <PageHeader
          title="Registrar Coleta Diaria"
          subtitle={displayDate || "Informe os dados da coleta de hoje"}
        />

        {/* Sem overflow-hidden no container para nao cortar o dropdown */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 pb-32 max-w-2xl mx-auto space-y-4">

            {/* Barra de progresso */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-slate-600">Progresso da ordenha</span>
                <span className="text-sm font-black text-[#1e3a29]">
                  {totals.milkedCows} / {totalActive} vacas
                </span>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#1e3a29] rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              {totals.totalMilk > 0 && (
                <p className="text-xs text-slate-500 mt-2 text-right font-semibold">
                  Total: <span className="text-[#1e3a29]">{totals.totalMilk.toFixed(1)} L</span>
                </p>
              )}
            </div>

            {activeAnimals.length === 0 ? (
              <div className="text-center text-slate-500 py-10 bg-white rounded-xl border border-slate-200">
                <Milk className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                <p className="font-semibold">Nenhum animal ativo cadastrado.</p>
                <p className="text-sm mt-1">Adicione animais para registrar a coleta.</p>
              </div>
            ) : (
              <>
                {/* Seletor de vaca — expansao inline, sem absolute */}
                {unconfirmedAnimals.length > 0 && !selectedAnimalId && (
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    {/* Cabecalho clicavel */}
                    <button
                      type="button"
                      onClick={() => setDropdownOpen((o) => !o)}
                      className="w-full flex items-center justify-between gap-2 p-4 text-left hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Milk className="w-5 h-5 text-slate-400 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-bold text-slate-700">Selecionar vaca para ordenhar</p>
                          <p className="text-xs text-slate-400">
                            {unconfirmedAnimals.length} vaca{unconfirmedAnimals.length !== 1 ? "s" : ""} restante{unconfirmedAnimals.length !== 1 ? "s" : ""}
                          </p>
                        </div>
                      </div>
                      {dropdownOpen
                        ? <ChevronUp className="w-5 h-5 text-slate-400 flex-shrink-0" />
                        : <ChevronDown className="w-5 h-5 text-slate-400 flex-shrink-0" />}
                    </button>

                    {/* Lista expandida inline */}
                    {dropdownOpen && (
                      <div className="border-t border-slate-100">
                        {/* Busca */}
                        <div className="p-3 border-b border-slate-100">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                              type="text"
                              autoFocus
                              placeholder="Buscar por nome ou brinco..."
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#d97706]"
                            />
                          </div>
                        </div>
                        {/* Lista */}
                        <ul className="divide-y divide-slate-50">
                          {filteredDropdown.length === 0 ? (
                            <li className="px-4 py-6 text-center text-slate-400 text-sm">
                              Nenhuma vaca encontrada
                            </li>
                          ) : (
                            filteredDropdown.map((animal) => (
                              <li key={animal.id}>
                                <button
                                  type="button"
                                  onClick={() => handleSelectAnimal(animal)}
                                  className="w-full text-left px-4 py-3 hover:bg-amber-50 active:bg-amber-100 transition-colors flex items-center gap-3"
                                >
                                  <div className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0">
                                    <Milk className="w-4 h-4 text-slate-500" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-bold text-[#1e3a29] text-sm truncate">
                                      {animalLabel(animal)}
                                    </p>
                                    {animal.breed && (
                                      <p className="text-xs text-slate-400 truncate">{animal.breed}</p>
                                    )}
                                  </div>
                                  {animal.tagNumber && (
                                    <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex-shrink-0">
                                      #{animal.tagNumber}
                                    </span>
                                  )}
                                </button>
                              </li>
                            ))
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Todas confirmadas */}
                {unconfirmedAnimals.length === 0 && !selectedAnimalId && (
                  <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl p-4">
                    <Check className="w-6 h-6 text-green-600 flex-shrink-0" />
                    <p className="font-semibold text-green-800">Todas as vacas foram ordenhadas!</p>
                  </div>
                )}

                {/* Formulario da vaca ativa */}
                {selectedAnimal && (
                  <ActiveCowForm
                    animal={selectedAnimal}
                    animalLabel={animalLabel(selectedAnimal)}
                    quantity={activeQuantity}
                    cmtResult={activeCmtResult}
                    onQuantityChange={setActiveQuantity}
                    onCmtChange={setActiveCmtResult}
                    onConfirm={handleConfirmCow}
                    onCancel={() => {
                      setSelectedAnimalId(null);
                      setActiveQuantity("");
                      setActiveCmtResult(null);
                    }}
                  />
                )}

                {/* Lista de confirmadas */}
                {Object.keys(confirmedItems).length > 0 && (
                  <ConfirmedCowsList
                    confirmedItems={confirmedItems}
                    animals={animals}
                    animalLabel={animalLabel}
                    onEdit={handleEditConfirmed}
                  />
                )}
              </>
            )}
          </div>
        </div>

        {/* Botao flutuante */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-sm border-t border-slate-100 z-30 md:left-64">
          <button
            type="button"
            onClick={handleFinalize}
            disabled={totals.milkedCows === 0 || isSubmitting}
            className="w-full max-w-2xl mx-auto block bg-[#d97706] hover:bg-[#b45309] disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white p-4 rounded-xl font-bold text-lg flex justify-center items-center gap-2 transform active:scale-95 transition-all"
          >
            {isSubmitting ? (
              <><Loader2 className="w-6 h-6 animate-spin" /> Salvando...</>
            ) : (
              <>
                <Save className="w-6 h-6" />
                Finalizar Coleta
                {totals.milkedCows > 0 && (
                  <span className="bg-white/20 text-sm px-2 py-0.5 rounded-full ml-1">
                    {totals.milkedCows} vacas · {totals.totalMilk.toFixed(1)} L
                  </span>
                )}
              </>
            )}
          </button>
        </div>
      </DashboardLayout>

      <ErrorModal
        isOpen={modalState.isOpen}
        onClose={() => {
          setModalState((prev) => ({ ...prev, isOpen: false }));
          if (modalState.type === "success") {
            router.push("/dashboardUser");
          }
        }}
        title={modalState.type === "success" ? "Sucesso!" : "Atencao"}
        message={modalState.message}
        type={modalState.type}
      />
    </>
  );
}
