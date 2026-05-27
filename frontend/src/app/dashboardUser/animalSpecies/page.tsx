"use client";

import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { DashboardLayout } from "@/components/layout";
import { PageHeader } from "@/components/dashboard";
import { Button, EmptyState, ErrorModal, ConfirmationModal } from "@/components/ui";
import InputField from "@/components/ui/input-field";
import DashboardLoading from "@/components/dashboard/DashboardLoading";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useAnimalSpecies, useCreateAnimalSpecies, useUpdateAnimalSpecies, useDeleteAnimalSpecies } from "@/hooks/queries/useAnimalSpecies";
import { AnimalSpecies } from "@/interfaces/animalSpecies";
import { Plus, Pencil, Trash2, X, Dna, Search } from "lucide-react";

const speciesSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(100, "Máximo 100 caracteres"),
  description: z.string().max(500, "Máximo 500 caracteres").optional(),
});
type SpeciesData = z.infer<typeof speciesSchema>;

interface SpeciesModalProps {
  isOpen: boolean;
  editing: AnimalSpecies | null;
  onClose: () => void;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}

function SpeciesModal({ isOpen, editing, onClose, onSuccess, onError }: SpeciesModalProps) {
  const isEditing = !!editing;
  const create = useCreateAnimalSpecies();
  const update = useUpdateAnimalSpecies();

  const { register, handleSubmit, formState: { errors } } = useForm<SpeciesData>({
    resolver: zodResolver(speciesSchema),
    defaultValues: { name: editing?.name ?? "", description: editing?.description ?? "" },
  });

  const onSubmit = async (data: SpeciesData) => {
    try {
      if (isEditing) {
        await update.mutateAsync({ id: editing.id, data });
        onSuccess("Tipo atualizado com sucesso!");
      } else {
        await create.mutateAsync(data);
        onSuccess("Tipo cadastrado com sucesso!");
      }
      onClose();
    } catch (err: any) {
      onError(err?.response?.data?.message || "Ocorreu um erro. Tente novamente.");
    }
  };

  const isPending = create.isPending || update.isPending;
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-xl font-bold text-[#1e3a29]">
            {isEditing ? "Editar Tipo" : "Novo Tipo de Animal"}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-5 space-y-4">
          <InputField
            label="Nome do Tipo *"
            placeholder="Ex: Vaca, Cabra, Ovelha..."
            error={errors.name?.message}
            {...register("name")}
          />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700">Descrição (opcional)</label>
            <textarea
              {...register("description")}
              placeholder="Descreva características deste tipo..."
              rows={3}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a29] resize-none"
            />
            {errors.description && <span className="text-xs text-red-500">{errors.description.message}</span>}
          </div>
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

export default function AnimalSpeciesPage() {
  const { isLoading: authLoading } = useAuthGuard("user");
  const { data: species = [], isLoading } = useAnimalSpecies();
  const deleteSpecies = useDeleteAnimalSpecies();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AnimalSpecies | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<AnimalSpecies | null>(null);
  const [search, setSearch] = useState("");
  const [feedback, setFeedback] = useState<{
    isOpen: boolean; title: string; message: string; type: "success" | "error";
  }>({ isOpen: false, title: "", message: "", type: "success" });

  const filtered = useMemo(() =>
    species.filter((s) => s.name.toLowerCase().includes(search.toLowerCase())),
    [species, search]
  );

  const openCreate = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (s: AnimalSpecies) => { setEditing(s); setModalOpen(true); };
  const showFeedback = (title: string, message: string, type: "success" | "error") =>
    setFeedback({ isOpen: true, title, message, type });

  const handleConfirmDelete = async () => {
    if (!confirmDelete) return;
    try {
      await deleteSpecies.mutateAsync(confirmDelete.id);
      setConfirmDelete(null);
      showFeedback("Sucesso!", "Tipo excluído com sucesso.", "success");
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
          title="Tipos de Animal"
          subtitle="Gerencie os tipos de animais do rebanho"
          actions={
            <Button variant="primary" onClick={openCreate} className="flex items-center gap-2">
              <Plus size={16} />
              Novo Tipo
            </Button>
          }
        />

        <div className="p-6 md:p-8 max-w-5xl mx-auto">
          {species.length > 0 && (
            <div className="relative mb-6 max-w-sm">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar tipo..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              />
            </div>
          )}

          {species.length === 0 && (
            <EmptyState
              icon={<Dna size={40} className="text-slate-400" />}
              title="Nenhum tipo cadastrado"
              description="Cadastre os tipos de animais do seu rebanho (Vaca, Cabra, Ovelha...)."
            />
          )}

          {species.length > 0 && filtered.length === 0 && (
            <div className="text-center py-16 text-slate-400 text-sm">
              Nenhum resultado para <strong>"{search}"</strong>.
            </div>
          )}

          {filtered.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#1e3a29] text-white">
                      <th className="px-6 py-4 text-left font-semibold">#</th>
                      <th className="px-6 py-4 text-left font-semibold">Nome</th>
                      <th className="px-6 py-4 text-left font-semibold hidden md:table-cell">Descrição</th>
                      <th className="px-6 py-4 text-right font-semibold">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filtered.map((s, index) => (
                      <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 text-slate-400 font-mono text-xs">{index + 1}</td>
                        <td className="px-6 py-4 font-semibold text-[#1e3a29]">{s.name}</td>
                        <td className="px-6 py-4 text-slate-500 hidden md:table-cell">
                          {s.description || <span className="text-slate-300 italic">sem descrição</span>}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openEdit(s)}
                              className="p-2 rounded-lg text-slate-500 hover:text-[#1e3a29] hover:bg-slate-100 transition-colors"
                              title="Editar"
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              onClick={() => setConfirmDelete(s)}
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
                {filtered.length} tipo{filtered.length !== 1 ? "s" : ""} cadastrado{filtered.length !== 1 ? "s" : ""}
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>

      <SpeciesModal
        key={editing?.id ?? "new"}
        isOpen={modalOpen}
        editing={editing}
        onClose={() => setModalOpen(false)}
        onSuccess={(msg) => showFeedback("Sucesso!", msg, "success")}
        onError={(msg) => showFeedback("Erro", msg, "error")}
      />

      <ConfirmationModal
        isOpen={!!confirmDelete}
        title="Excluir Tipo"
        message={`Tem certeza que deseja excluir "${confirmDelete?.name}"? Animais deste tipo serão afetados.`}
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
