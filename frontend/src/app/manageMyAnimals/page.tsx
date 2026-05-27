"use client";

import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { DashboardLayout } from "@/components/layout";
import { PageHeader } from "@/components/dashboard";
import { Button, EmptyState, ErrorModal, ConfirmationModal } from "@/components/ui";
import InputField from "@/components/ui/input-field";
import SelectField from "@/components/ui/select-field";
import DashboardLoading from "@/components/dashboard/DashboardLoading";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useUserAnimals, useCreateAnimal, useUpdateAnimal, useDeleteAnimal } from "@/hooks/queries/useAnimals";
import { useBreeds } from "@/hooks/queries/useBreeds";
import { useAnimalSpecies } from "@/hooks/queries/useAnimalSpecies";
import { Animal } from "@/interfaces/animal";
import { animalSchema, AnimalData } from "@/schemas/animal";
import { Plus, Pencil, Trash2, X, Cat, Search } from "lucide-react";

interface AnimalModalProps {
  isOpen: boolean;
  editingAnimal: Animal | null;
  userId: number;
  onClose: () => void;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}

function AnimalModal({ isOpen, editingAnimal, userId, onClose, onSuccess, onError }: AnimalModalProps) {
  const isEditing = !!editingAnimal;
  const createAnimal = useCreateAnimal();
  const updateAnimal = useUpdateAnimal();
  const { data: breeds = [], isLoading: loadingBreeds } = useBreeds();
  const { data: species = [], isLoading: loadingSpecies } = useAnimalSpecies();

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<AnimalData>({
    resolver: zodResolver(animalSchema),
    defaultValues: {
      name: editingAnimal?.name ?? "",
      animalSpeciesId: editingAnimal?.animalSpeciesId ?? undefined,
      breedId: editingAnimal?.breedId ?? undefined,
      breed: editingAnimal?.breed ?? "",
      age: editingAnimal?.age ?? 1,
    },
  });

  const selectedBreedId = watch("breedId");
  const selectedSpeciesId = watch("animalSpeciesId");

  const speciesOptions = species.map((s) => ({ value: String(s.id), label: s.name }));
  const breedOptions = breeds.map((b) => ({ value: String(b.id), label: b.name }));

  const handleSpeciesChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setValue("animalSpeciesId", Number(e.target.value), { shouldValidate: true });
  };

  const handleBreedChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = Number(e.target.value);
    setValue("breedId", id, { shouldValidate: true });
    const found = breeds.find((b) => b.id === id);
    setValue("breed", found?.name ?? "");
  };

  const onSubmit = async (data: AnimalData) => {
    try {
      if (isEditing) {
        await updateAnimal.mutateAsync({ id: editingAnimal.id, data });
        onSuccess("Animal atualizado com sucesso!");
      } else {
        await createAnimal.mutateAsync({ data, userId });
        onSuccess("Animal cadastrado com sucesso!");
      }
      onClose();
    } catch (err: any) {
      onError(err?.response?.data?.message || "Ocorreu um erro. Tente novamente.");
    }
  };

  const isPending = createAnimal.isPending || updateAnimal.isPending;
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-xl font-bold text-[#1e3a29]">
            {isEditing ? "Editar Animal" : "Novo Animal"}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-5 space-y-4">
          <InputField
            label="Nome do Animal (opcional)"
            placeholder="Ex: Mimosa, Estrela..."
            error={errors.name?.message}
            {...register("name")}
          />
          <SelectField
            label="Tipo de Animal *"
            placeholder={
              loadingSpecies ? "Carregando tipos..." :
              speciesOptions.length === 0 ? "Nenhum tipo cadastrado — vá em Tipos de Animal" :
              "Selecione o tipo"
            }
            disabled={loadingSpecies || speciesOptions.length === 0}
            error={errors.animalSpeciesId?.message}
            options={speciesOptions}
            value={selectedSpeciesId ? String(selectedSpeciesId) : ""}
            onChange={handleSpeciesChange}
          />
          <SelectField
            label="Raça *"
            placeholder={loadingBreeds ? "Carregando raças..." : breedOptions.length === 0 ? "Nenhuma raça cadastrada" : "Selecione uma raça"}
            disabled={loadingBreeds || breedOptions.length === 0}
            error={errors.breedId?.message}
            options={breedOptions}
            value={selectedBreedId ? String(selectedBreedId) : ""}
            onChange={handleBreedChange}
          />
          <InputField
            label="Idade (anos) *"
            type="number"
            min="0"
            max="30"
            error={errors.age?.message}
            {...register("age", { valueAsNumber: true })}
          />
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" fullWidth onClick={onClose} disabled={isPending}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" fullWidth loading={isPending}>
              {isEditing ? "Salvar Alterações" : "Cadastrar"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ManageAnimals() {
  const { userId, isLoading: authLoading } = useAuthGuard("user");
  const { data: animals = [], isLoading } = useUserAnimals(userId);
  const deleteAnimal = useDeleteAnimal();

  const [modalOpen, setModalOpen]         = useState(false);
  const [editingAnimal, setEditingAnimal] = useState<Animal | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Animal | null>(null);
  const [search, setSearch]               = useState("");
  const [feedback, setFeedback] = useState<{
    isOpen: boolean; title: string; message: string; type: "success" | "error";
  }>({ isOpen: false, title: "", message: "", type: "success" });

  const filtered = useMemo(() =>
    animals.filter((a) =>
      (a.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (a.animalSpecies?.name ?? a.animalType ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (a.breed ?? "").toLowerCase().includes(search.toLowerCase())
    ),
    [animals, search]
  );

  const openCreate = () => { setEditingAnimal(null); setModalOpen(true); };
  const openEdit   = (a: Animal) => { setEditingAnimal(a); setModalOpen(true); };
  const showFeedback = (title: string, message: string, type: "success" | "error") =>
    setFeedback({ isOpen: true, title, message, type });

  const handleConfirmDelete = async () => {
    if (!confirmDelete) return;
    try {
      await deleteAnimal.mutateAsync(confirmDelete.id);
      setConfirmDelete(null);
      showFeedback("Sucesso!", "Animal excluído com sucesso.", "success");
    } catch (err: any) {
      setConfirmDelete(null);
      showFeedback("Erro", err?.response?.data?.message || "Não foi possível excluir.", "error");
    }
  };

  if (authLoading || isLoading) return <DashboardLoading />;

  return (
    <>
      <DashboardLayout>
        <PageHeader
          title="Meus Animais"
          subtitle="Gerencie o rebanho da sua fazenda"
          actions={
            <Button variant="primary" onClick={openCreate} className="flex items-center gap-2">
              <Plus size={16} />
              Novo Animal
            </Button>
          }
        />

        <div className="p-6 md:p-8 max-w-5xl mx-auto">
          {animals.length > 0 && (
            <div className="relative mb-6 max-w-sm">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nome, tipo ou raça..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              />
            </div>
          )}

          {!isLoading && animals.length === 0 && (
            <EmptyState
              icon={<Cat size={40} className="text-slate-400" />}
              title="Nenhum animal cadastrado"
              description="Cadastre seu primeiro animal para começar a gerenciar o rebanho."
            />
          )}

          {!isLoading && animals.length > 0 && filtered.length === 0 && (
            <div className="text-center py-16 text-slate-400 text-sm">
              Nenhum resultado para <strong>"{search}"</strong>.
            </div>
          )}

          {!isLoading && filtered.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#1e3a29] text-white">
                      <th className="px-6 py-4 text-left font-semibold">#</th>
                      <th className="px-6 py-4 text-left font-semibold">Nome</th>
                      <th className="px-6 py-4 text-left font-semibold hidden md:table-cell">Tipo</th>
                      <th className="px-6 py-4 text-left font-semibold hidden md:table-cell">Raça</th>
                      <th className="px-6 py-4 text-left font-semibold hidden md:table-cell">Idade</th>
                      <th className="px-6 py-4 text-right font-semibold">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filtered.map((animal, index) => (
                      <tr key={animal.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 text-slate-400 font-mono text-xs">{index + 1}</td>
                        <td className="px-6 py-4">
                          <span className="font-semibold text-[#1e3a29]">
                            {animal.name || <span className="text-slate-400 italic font-normal">Sem nome</span>}
                          </span>
                          <span className="block text-xs text-slate-500 mt-0.5 md:hidden">
                            {animal.animalSpecies?.name ?? animal.animalType ?? "—"} {animal.breed ? `- ${animal.breed}` : ""} - {animal.age}a
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-600 hidden md:table-cell">
                          {animal.animalSpecies?.name ?? animal.animalType ?? <span className="text-slate-300 italic">—</span>}
                        </td>
                        <td className="px-6 py-4 text-slate-600 hidden md:table-cell">
                          {animal.breed ?? <span className="text-slate-300 italic">sem raça</span>}
                        </td>
                        <td className="px-6 py-4 text-slate-600 hidden md:table-cell">
                          {animal.age} ano{animal.age !== 1 ? "s" : ""}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openEdit(animal)}
                              className="p-2 rounded-lg text-slate-500 hover:text-[#1e3a29] hover:bg-slate-100 transition-colors"
                              title="Editar"
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              onClick={() => setConfirmDelete(animal)}
                              className="p-2 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                              title="Excluir"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 text-xs text-slate-400">
                {filtered.length} animal{filtered.length !== 1 ? "is" : ""} cadastrado{filtered.length !== 1 ? "s" : ""}
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>

      <AnimalModal
        key={editingAnimal?.id ?? "new"}
        isOpen={modalOpen}
        editingAnimal={editingAnimal}
        userId={userId ?? 0}
        onClose={() => setModalOpen(false)}
        onSuccess={(msg) => showFeedback("Sucesso!", msg, "success")}
        onError={(msg) => showFeedback("Erro", msg, "error")}
      />

      <ConfirmationModal
        isOpen={!!confirmDelete}
        title="Excluir Animal"
        message={`Tem certeza que deseja excluir "${confirmDelete?.name || "este animal"}"? Esta ação não pode ser desfeita.`}
        confirmText="Sim, Excluir"
        cancelText="Cancelar"
        variant="primary"
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDelete(null)}
      />

      <ErrorModal
        isOpen={feedback.isOpen}
        onClose={() => setFeedback((prev) => ({ ...prev, isOpen: false }))}
        title={feedback.title}
        message={feedback.message}
        type={feedback.type}
      />
    </>
  );
}
