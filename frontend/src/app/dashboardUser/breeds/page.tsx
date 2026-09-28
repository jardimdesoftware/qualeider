"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { DashboardLayout } from "@/components/layout";
import { PageHeader } from "@/components/dashboard";
import {
  Button,
  EmptyState,
  ErrorModal,
  ConfirmationModal,
} from "@/components/ui";
import InputField from "@/components/ui/input-field";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useRoleGuard } from "@/hooks/useRoleGuard";
import DashboardLoading from "@/components/dashboard/DashboardLoading";
import {
  useBreeds,
  useCreateBreed,
  useUpdateBreed,
  useDeleteBreed,
} from "@/hooks/queries/useBreeds";
import { Breed, CreateBreedDto } from "@/interfaces/breed";
import { Plus, Pencil, Trash2, X, Tag, Loader2, Search } from "lucide-react";

// ─── Modal de Criar / Editar ────────────────────────────────────────────────

interface BreedFormData {
  name: string;
  description?: string;
}

interface BreedModalProps {
  isOpen: boolean;
  editingBreed: Breed | null;
  onClose: () => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

function BreedModal({
  isOpen,
  editingBreed,
  onClose,
  onSuccess,
  onError,
}: BreedModalProps) {
  const createBreed = useCreateBreed();
  const updateBreed = useUpdateBreed();

  const isEditing = !!editingBreed;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BreedFormData>({
    defaultValues: {
      name: editingBreed?.name ?? "",
      description: editingBreed?.description ?? "",
    },
  });

  const onSubmit = async (formData: BreedFormData) => {
    const payload: CreateBreedDto = {
      name: formData.name.trim(),
      description: formData.description?.trim() || undefined,
    };

    try {
      if (isEditing) {
        await updateBreed.mutateAsync({ id: editingBreed.id, data: payload });
        onSuccess("Raça atualizada com sucesso!");
      } else {
        await createBreed.mutateAsync(payload);
        onSuccess("Raça cadastrada com sucesso!");
      }
      //reset();
      onClose();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message || "Ocorreu um erro. Tente novamente.";
      onError(msg);
    }
  };

  const isPending = createBreed.isPending || updateBreed.isPending;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-800">
            {isEditing ? "Editar Raça" : "Nova Raça"}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-5 space-y-4">
          <InputField
            label="Nome da Raça *"
            placeholder="Ex: Holandês, Girolando, Nelore..."
            error={errors.name?.message}
            registration={register("name", {
              required: "Nome é obrigatório",
              minLength: { value: 2, message: "Mínimo 2 caracteres" },
              maxLength: { value: 100, message: "Máximo 100 caracteres" },
            })}
          />

          <div className="space-y-1">
            <label className="text-slate-800 font-medium text-sm">
              Descrição (opcional)
            </label>
            <textarea
              placeholder="Descreva características da raça..."
              rows={3}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm shadow-sm resize-none
                focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              {...register("description", {
                maxLength: { value: 500, message: "Máximo 500 caracteres" },
              })}
            />
            {errors.description && (
              <p className="text-red-500 text-xs">
                {errors.description.message}
              </p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              fullWidth
              onClick={onClose}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              fullWidth
              loading={isPending}
            >
              {isEditing ? "Salvar Alterações" : "Cadastrar"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Página Principal ────────────────────────────────────────────────────────

export default function BreedsPage() {
  useAuthGuard();
  const { isChecking } = useRoleGuard(["ADMIN"]);

  const { data: breeds = [], isLoading, isError } = useBreeds();
  const deleteBreed = useDeleteBreed();
  const [search, setSearch] = useState("");
  const filtered = useMemo(
    () =>
      breeds.filter((b) => b.name.toLowerCase().includes(search.toLowerCase())),
    [breeds, search],
  );

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBreed, setEditingBreed] = useState<Breed | null>(null);

  // Confirmação de exclusão
  const [confirmDelete, setConfirmDelete] = useState<Breed | null>(null);

  // Feedback
  const [feedback, setFeedback] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: "success" | "error" | "info";
  }>({ isOpen: false, title: "", message: "", type: "success" });

  const openCreate = () => {
    setEditingBreed(null);
    setModalOpen(true);
  };

  const openEdit = (breed: Breed) => {
    setEditingBreed(breed);
    setModalOpen(true);
  };

  const handleSuccess = (message: string) => {
    setFeedback({
      isOpen: true,
      title: "Sucesso!",
      message,
      type: "success",
    });
  };

  const handleError = (message: string) => {
    setFeedback({
      isOpen: true,
      title: "Erro",
      message,
      type: "error",
    });
  };

  const handleConfirmDelete = async () => {
    if (!confirmDelete) return;
    try {
      await deleteBreed.mutateAsync(confirmDelete.id);
      setConfirmDelete(null);
      handleSuccess(`Raça "${confirmDelete.name}" excluída com sucesso.`);
    } catch (err: any) {
      setConfirmDelete(null);
      handleError(
        err?.response?.data?.message || "Não foi possível excluir a raça.",
      );
    }
  };

  if (isChecking) return <DashboardLoading />;

  return (
    <>
      <DashboardLayout>
        <PageHeader
          title="Raças"
          subtitle="Gerencie o catálogo de raças de animais"
        />

        <div className="flex-1 min-h-0 flex flex-col w-full p-4 md:p-6 max-w-5xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-2 shrink-0">
            <div className="relative w-full sm:max-w-xs">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="Buscar raça..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              />
            </div>
            <Button
              variant="primary"
              onClick={openCreate}
              className="flex items-center gap-2 shrink-0"
            >
              <Plus size={16} />
              Nova Raça
            </Button>
          </div>

          {/* Loading */}
          {isLoading && (
            <div className="flex items-center justify-center py-20 text-slate-400">
              <Loader2 className="animate-spin mr-2" size={20} />
              <span>Carregando raças...</span>
            </div>
          )}

          {/* Erro */}
          {isError && (
            <div className="text-center py-20 text-red-500">
              Não foi possível carregar as raças. Tente recarregar a página.
            </div>
          )}

          {/* Lista vazia */}
          {!isLoading && !isError && breeds.length === 0 && (
            <EmptyState
              icon={<Tag size={40} />}
              title="Nenhuma raça cadastrada"
              description="Cadastre a primeira raça para que ela apareça aqui."
            />
          )}

          {/* Tabela */}
          {!isLoading &&
            !isError &&
            breeds.length > 0 &&
            filtered.length === 0 && (
              <div className="text-center py-16 text-slate-400 text-sm">
                Nenhum resultado para <strong>&quot;{search}&quot;</strong>.
              </div>
            )}

          {!isLoading && !isError && filtered.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col min-h-0 flex-1">
              <div className="overflow-auto min-h-0 flex-1">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 z-10 bg-gray-50">
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-6 py-4 text-left font-semibold text-gray-600">
                        #
                      </th>
                      <th className="px-6 py-4 text-left font-semibold text-gray-600">
                        Nome
                      </th>
                      <th className="px-6 py-4 text-left font-semibold text-gray-600 hidden md:table-cell">
                        Descrição
                      </th>
                      <th className="px-6 py-4 text-right font-semibold text-gray-600">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filtered.map((breed, index) => (
                      <tr
                        key={breed.id}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        <td className="px-6 py-4 text-slate-400 font-mono text-xs">
                          {index + 1}
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-semibold text-slate-800">
                            {breed.name}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-500 hidden md:table-cell max-w-xs">
                          <span className="truncate block">
                            {breed.description || (
                              <span className="text-slate-300 italic">
                                Sem descrição
                              </span>
                            )}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openEdit(breed)}
                              className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                              title="Editar"
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              onClick={() => setConfirmDelete(breed)}
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
                {filtered.length}{" "}
                {filtered.length === 1
                  ? "raça cadastrada"
                  : "raças cadastradas"}
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>

      {/* Modal criar/editar — key força remount ao trocar entre criar/editar */}
      <BreedModal
        key={editingBreed?.id ?? "new"}
        isOpen={modalOpen}
        editingBreed={editingBreed}
        onClose={() => setModalOpen(false)}
        onSuccess={handleSuccess}
        onError={handleError}
      />

      {/* Modal confirmação de exclusão */}
      <ConfirmationModal
        isOpen={!!confirmDelete}
        title="Excluir Raça"
        message={`Tem certeza que deseja excluir a raça "${confirmDelete?.name}"? Esta ação não pode ser desfeita.`}
        confirmText="Sim, Excluir"
        cancelText="Cancelar"
        variant="primary"
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDelete(null)}
      />

      {/* Feedback (sucesso / erro) */}
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
