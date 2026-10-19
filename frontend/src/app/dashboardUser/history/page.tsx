"use client";

import { useMemo, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { DashboardLayout } from "@/components/layout";
import { PageHeader } from "@/components/dashboard";
import { ConfirmationModal } from "@/components/ui";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useRoleGuard } from "@/hooks/useRoleGuard";
import DashboardLoading from "@/components/dashboard/DashboardLoading";
import { CollectionDetailsModal } from "./_components/CollectionDetailsModal";
import { EditCollectionModal } from "./_components/EditCollectionModal";
import {
  useUserCollections,
  useUpdateCollection,
  useDeleteCollection,
} from "@/hooks/queries/useCollections";
import { useDestinations } from "@/hooks/queries/useDestinations";
import { DailyCollection } from "@/interfaces/daily-collection";
import { getFriendlyErrorMessage } from "@/utils/errorMessage";
import {
  collectionAuthors,
  filterCollections,
  sortByDateDesc,
  totalLiters,
} from "@/utils/collection-filters";

const selectCls =
  "h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary";

/**
 * Coletas registradas (ADMIN): o que cada vaqueiro do grupo coletou, para onde
 * o leite foi, com filtros, e a possibilidade de ver, ajustar e excluir.
 */
export default function CollectionHistory() {
  const { userId, isLoading: authLoading } = useAuthGuard();
  const { isChecking: roleChecking } = useRoleGuard(["ADMIN"]);
  const { data: rawCollections = [], isLoading: loading } =
    useUserCollections(userId);
  const { data: destinations = [] } = useDestinations();

  const [selectedCollection, setSelectedCollection] =
    useState<DailyCollection | null>(null);
  const [editingCollection, setEditingCollection] =
    useState<DailyCollection | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<DailyCollection | null>(
    null,
  );
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [destinationFilter, setDestinationFilter] = useState<number | null>(
    null,
  );
  const [authorFilter, setAuthorFilter] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const authors = useMemo(
    () => collectionAuthors(rawCollections),
    [rawCollections],
  );
  const collections = useMemo(
    () =>
      sortByDateDesc(
        filterCollections(rawCollections, {
          destinationId: destinationFilter,
          userId: authorFilter,
        }),
      ),
    [rawCollections, destinationFilter, authorFilter],
  );

  const updateCollection = useUpdateCollection(userId);
  const deleteCollection = useDeleteCollection(userId);

  const showFeedback = (type: "success" | "error", message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), type === "success" ? 3000 : 4000);
  };

  const handleSaveEdit = (id: number, data: Partial<any>) => {
    updateCollection.mutate(
      { id, data },
      {
        onSuccess: () => {
          setEditingCollection(null);
          showFeedback("success", "Coleta atualizada com sucesso!");
        },
        onError: (err: any) =>
          showFeedback("error", getFriendlyErrorMessage(err)),
      },
    );
  };

  const handleConfirmDelete = () => {
    if (!confirmDelete) return;
    const id = confirmDelete.id;
    setConfirmDelete(null);
    setDeletingId(id);
    deleteCollection.mutate(id, {
      onSuccess: () => {
        setDeletingId(null);
        showFeedback("success", "Coleta excluída com sucesso!");
      },
      onError: (err: any) => {
        setDeletingId(null);
        showFeedback("error", getFriendlyErrorMessage(err));
      },
    });
  };

  if (authLoading || roleChecking || loading) return <DashboardLoading />;

  return (
    <>
      <DashboardLayout>
        <PageHeader
          title="Coletas registradas"
          subtitle="Veja o que cada vaqueiro coletou e para onde o leite foi"
        />

        <div className="flex-1 min-h-0 flex flex-col w-full p-4 md:p-6 max-w-5xl mx-auto">
          {/* Feedback toast */}
          {feedback && (
            <div
              className={`mb-4 px-4 py-3 rounded-lg text-sm font-medium ${
                feedback.type === "success"
                  ? "bg-green-100 text-green-800 border border-green-200"
                  : "bg-red-100 text-red-800 border border-red-200"
              }`}
            >
              {feedback.message}
            </div>
          )}

          {/* Filtros e total */}
          <div className="mb-4 flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1 text-xs font-semibold text-gray-600">
              Registrada por
              <select
                className={selectCls}
                value={authorFilter ?? ""}
                onChange={(e) =>
                  setAuthorFilter(e.target.value ? Number(e.target.value) : null)
                }
              >
                <option value="">Todos</option>
                {authors.map((author) => (
                  <option key={author.id} value={author.id}>
                    {author.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-xs font-semibold text-gray-600">
              Destino
              <select
                className={selectCls}
                value={destinationFilter ?? ""}
                onChange={(e) =>
                  setDestinationFilter(
                    e.target.value ? Number(e.target.value) : null,
                  )
                }
              >
                <option value="">Todos</option>
                {destinations.map((destination) => (
                  <option key={destination.id} value={destination.id}>
                    {destination.name}
                  </option>
                ))}
              </select>
            </label>
            <p className="ml-auto text-sm text-slate-600">
              <strong className="text-slate-800">{collections.length}</strong>{" "}
              {collections.length === 1 ? "coleta" : "coletas"} ·{" "}
              <strong className="text-slate-800">
                {totalLiters(collections).toFixed(1)} L
              </strong>
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-md border border-slate-100 overflow-hidden flex flex-col min-h-0 flex-1">
            <div className="overflow-auto min-h-0 flex-1">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 z-10 bg-gray-50">
                  <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase text-gray-500 font-semibold tracking-wider">
                    <th className="px-6 py-4">Data</th>
                    <th className="px-6 py-4">Registrada por</th>
                    <th className="px-6 py-4">Quantidade (L)</th>
                    <th className="px-6 py-4">Destino</th>
                    <th className="px-6 py-4">Animais</th>
                    <th className="px-6 py-4">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {collections.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-6 py-8 text-center text-gray-500"
                      >
                        Nenhuma coleta registrada.
                      </td>
                    </tr>
                  ) : (
                    collections.map((item) => (
                      <tr
                        key={item.id}
                        className="hover:bg-[#fdfbf7] transition-colors"
                      >
                        <td className="px-6 py-4 text-gray-900 font-medium">
                          {new Date(item.collectionDate).toLocaleDateString(
                            "pt-BR",
                            { timeZone: "UTC" },
                          )}
                        </td>
                        <td className="px-6 py-4 text-gray-700">
                          {item.user?.name ?? `Usuário #${item.userId}`}
                        </td>
                        <td className="px-6 py-4 text-slate-800 font-bold">
                          {item.quantity} L
                        </td>
                        <td className="px-6 py-4">
                          {item.destination ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-900">
                              {item.destination.name}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-xs">
                              Sem destino
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {item.numAnimals}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setSelectedCollection(item)}
                              className="text-sm font-medium text-[#d97706] hover:text-[#b45309] hover:underline"
                            >
                              Ver
                            </button>
                            <span className="text-gray-300">|</span>
                            <button
                              onClick={() => setEditingCollection(item)}
                              title="Editar coleta"
                              className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              onClick={() => setConfirmDelete(item)}
                              disabled={deletingId === item.id}
                              title="Excluir coleta"
                              className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </DashboardLayout>

      <CollectionDetailsModal
        isOpen={!!selectedCollection}
        onClose={() => setSelectedCollection(null)}
        collection={selectedCollection}
      />

      <EditCollectionModal
        isOpen={!!editingCollection}
        onClose={() => setEditingCollection(null)}
        collection={editingCollection}
        onSave={handleSaveEdit}
        isSaving={updateCollection.isPending}
      />

      <ConfirmationModal
        isOpen={!!confirmDelete}
        title="Excluir coleta"
        message={`Excluir a coleta de ${
          confirmDelete
            ? new Date(confirmDelete.collectionDate).toLocaleDateString("pt-BR", {
                timeZone: "UTC",
              })
            : ""
        } (${confirmDelete?.quantity ?? 0} L)? Ela deixa de aparecer na lista.`}
        confirmText="Sim, Excluir"
        cancelText="Cancelar"
        variant="primary"
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </>
  );
}
