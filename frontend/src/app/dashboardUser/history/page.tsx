"use client";

import { useMemo, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { DashboardLayout } from "@/components/layout";
import { PageHeader } from "@/components/dashboard";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import DashboardLoading from "@/components/dashboard/DashboardLoading";
import { CollectionDetailsModal } from "./_components/CollectionDetailsModal";
import { EditCollectionModal } from "./_components/EditCollectionModal";
import { useUserCollections, useUpdateCollection, useDeleteCollection } from "@/hooks/queries/useCollections";
import { DailyCollection } from "@/interfaces/daily-collection";
import { getFriendlyErrorMessage } from "@/utils/errorMessage";

export default function CollectionHistory() {
  const { userId, isLoading: authLoading } = useAuthGuard("user");
  const { data: rawCollections = [], isLoading: loading } = useUserCollections(userId);

  const [selectedCollection, setSelectedCollection] = useState<DailyCollection | null>(null);
  const [editingCollection, setEditingCollection] = useState<DailyCollection | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const collections = useMemo(
    () =>
      [...rawCollections].sort(
        (a, b) => new Date(b.collectionDate).getTime() - new Date(a.collectionDate).getTime()
      ),
    [rawCollections]
  );

  const updateCollection = useUpdateCollection(userId);
  const deleteCollection = useDeleteCollection(userId);

  const handleSaveEdit = (id: number, data: Partial<any>) => {
    updateCollection.mutate(
      { id, data },
      {
        onSuccess: () => {
          setEditingCollection(null);
          setFeedback({ type: "success", message: "Coleta atualizada com sucesso!" });
          setTimeout(() => setFeedback(null), 3000);
        },
        onError: (err: any) => {
          setFeedback({ type: "error", message: getFriendlyErrorMessage(err) });
          setTimeout(() => setFeedback(null), 4000);
        },
      }
    );
  };

  const handleDelete = (id: number) => {
    setDeletingId(id);
    deleteCollection.mutate(id, {
      onSuccess: () => {
        setDeletingId(null);
        setFeedback({ type: "success", message: "Coleta excluída com sucesso!" });
        setTimeout(() => setFeedback(null), 3000);
      },
      onError: (err: any) => {
        setDeletingId(null);
        setFeedback({ type: "error", message: getFriendlyErrorMessage(err) });
        setTimeout(() => setFeedback(null), 4000);
      },
    });
  };

  if (authLoading || loading) return <DashboardLoading />;

  return (
    <>
      <DashboardLayout>
        <PageHeader
          title="Histórico de Coletas"
          subtitle="Visualize e gerencie seus envios anteriores"
        />

        <div className="p-6 md:p-8 max-w-5xl mx-auto">
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

          <div className="bg-white rounded-xl shadow-md border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase text-gray-500 font-semibold tracking-wider">
                    <th className="px-6 py-4">Data</th>
                    <th className="px-6 py-4">Quantidade (L)</th>
                    <th className="px-6 py-4">Animais</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {collections.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                        Nenhuma coleta registrada.
                      </td>
                    </tr>
                  ) : (
                    collections.map((item) => (
                      <tr key={item.id} className="hover:bg-[#fdfbf7] transition-colors">
                        <td className="px-6 py-4 text-gray-900 font-medium">
                          {new Date(item.collectionDate).toLocaleDateString("pt-BR", {
                            timeZone: "UTC",
                          })}
                        </td>
                        <td className="px-6 py-4 text-brand-primary font-bold">
                          {item.quantity} L
                        </td>
                        <td className="px-6 py-4 text-gray-600">{item.numAnimals}</td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Recebido
                          </span>
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
                              className="p-1.5 text-slate-500 hover:text-brand-primary hover:bg-slate-100 rounded-lg transition-colors"
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
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
    </>
  );
}
