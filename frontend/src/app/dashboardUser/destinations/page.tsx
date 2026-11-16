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
  useDestinations,
  useCreateDestination,
  useUpdateDestination,
  useDeleteDestination,
} from "@/hooks/queries/useDestinations";
import { Destination, CreateDestinationDto } from "@/interfaces/destination";
import { Plus, Pencil, Trash2, X, Tag, Loader2, Search } from "lucide-react";

// ─── Modal de Criar / Editar ────────────────────────────────────────────────

interface DestinationFormData {
  name: string;
  description?: string;
}

interface DestinationModalProps {
  isOpen: boolean;
  editingDestination: Destination | null;
  onClose: () => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

function DestinationModal({
  isOpen,
  editingDestination,
  onClose,
  onSuccess,
  onError,
}: DestinationModalProps) {
  const createDestination = useCreateDestination();
  const updateDestination = useUpdateDestination();

  const isEditing = !!editingDestination;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DestinationFormData>({
    defaultValues: {
      name: editingDestination?.name ?? "",
      description: editingDestination?.description ?? "",
    },
  });

  const onSubmit = async (formData: DestinationFormData) => {
    const payload: CreateDestinationDto = {
      name: formData.name.trim(),
      description: formData.description?.trim() || undefined,
    };

    try {
      if (isEditing) {
        await updateDestination.mutateAsync({ id: editingDestination.id, data: payload });
        onSuccess("Destino atualizado com sucesso!");
      } else {
        await createDestination.mutateAsync(payload);
        onSuccess("Destino cadastrado com sucesso!");
      }
      //reset();
      onClose();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message || "Ocorreu um erro. Tente novamente.";
      onError(msg);
    }
  };

  const isPending = createDestination.isPending || updateDestination.isPending;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-800">
            {isEditing ? "Editar Destino" : "Novo Destino"}
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
            label="Nome do Destino *"
            placeholder="Ex: Laticínio, Consumo da fazenda, Bezerros..."
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
              placeholder="Descreva para onde o leite vai..."
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

export default function DestinationsPage() {
  useAuthGuard();
  const { isChecking } = useRoleGuard(["ADMIN"]);

  const { data: destinations = [], isLoading, isError } = useDestinations();
  const deleteDestination = useDeleteDestination();
  const [search, setSearch] = useState("");
  const filtered = useMemo(
    () =>
      destinations.filter((b) => b.name.toLowerCase().includes(search.toLowerCase())),
    [destinations, search],
  );

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDestination, setEditingDestination] = useState<Destination | null>(null);

  // Confirmação de exclusão
  const [confirmDelete, setConfirmDelete] = useState<Destination | null>(null);

  // Feedback
  const [feedback, setFeedback] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: "success" | "error" | "info";
  }>({ isOpen: false, title: "", message: "", type: "success" });

  const openCreate = () => {
    setEditingDestination(null);
    setModalOpen(true);
  };

  const openEdit = (destination: Destination) => {
    setEditingDestination(destination);
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
      await deleteDestination.mutateAsync(confirmDelete.id);
      setConfirmDelete(null);
      handleSuccess(`Destino "${confirmDelete.name}" excluído com sucesso.`);
    } catch (err: any) {
      setConfirmDelete(null);
      handleError(
        err?.response?.data?.message || "Não foi possível excluir o destino.",
      );
    }
  };

  if (isChecking) return <DashboardLoading />;

  return (
    <>
      <DashboardLayout>
        <PageHeader
          title="Destinos"
          subtitle="Gerencie para onde o leite coletado é enviado"
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
                placeholder="Buscar destino..."
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
              Novo Destino
            </Button>
          </div>

          {/* Loading */}
          {isLoading && (
            <div className="flex items-center justify-center py-20 text-slate-400">
              <Loader2 className="animate-spin mr-2" size={20} />
              <span>Carregando destinos...</span>
            </div>
          )}

          {/* Erro */}
          {isError && (
            <div className="text-center py-20 text-red-500">
              Não foi possível carregar os destinos. Tente recarregar a página.
            </div>
          )}

          {/* Lista vazia */}
          {!isLoading && !isError && destinations.length === 0 && (
            <EmptyState
              icon={<Tag size={40} />}
              title="Nenhum destino cadastrado"
              description="Cadastre o primeiro destino para que ele apareça aqui."
            />
          )}

          {/* Tabela */}
          {!isLoading &&
            !isError &&
            destinations.length > 0 &&
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
                    {filtered.map((destination, index) => (
                      <tr
                        key={destination.id}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        <td className="px-6 py-4 text-slate-400 font-mono text-xs">
                          {index + 1}
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-semibold text-slate-800">
                            {destination.name}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-500 hidden md:table-cell max-w-xs">
                          <span className="truncate block">
                            {destination.description || (
                              <span className="text-slate-300 italic">
                                Sem descrição
                              </span>
                            )}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openEdit(destination)}
                              className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                              title="Editar"
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              onClick={() => setConfirmDelete(destination)}
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
                  ? "destino cadastrado"
                  : "destinos cadastrados"}
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>

      {/* Modal criar/editar — key força remount ao trocar entre criar/editar */}
      <DestinationModal
        key={editingDestination?.id ?? "new"}
        isOpen={modalOpen}
        editingDestination={editingDestination}
        onClose={() => setModalOpen(false)}
        onSuccess={handleSuccess}
        onError={handleError}
      />

      {/* Modal confirmação de exclusão */}
      <ConfirmationModal
        isOpen={!!confirmDelete}
        title="Excluir Destino"
        message={`Tem certeza que deseja excluir o destino "${confirmDelete?.name}"? Esta ação não pode ser desfeita.`}
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
