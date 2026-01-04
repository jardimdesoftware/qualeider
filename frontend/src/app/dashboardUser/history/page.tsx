"use client";

import { useMemo, useState } from "react";
import { DashboardLayout } from "@/components/layout";
import { PageHeader } from "@/components/dashboard";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import DashboardLoading from "@/components/dashboard/DashboardLoading";
import { CollectionDetailsModal } from "./_components/CollectionDetailsModal";
import { useUserCollections } from "@/hooks/queries/useCollections";

export default function CollectionHistory() {
  const { userId, isLoading: authLoading } = useAuthGuard("user");
  const { data: rawCollections = [], isLoading: loading } = useUserCollections(userId);
  const [selectedCollection, setSelectedCollection] = useState<any | null>(null);
  const collections = useMemo(() => {
    return [...rawCollections].sort((a, b) => 
      new Date(b.collectionDate).getTime() - new Date(a.collectionDate).getTime()
    );
  }, [rawCollections]);

  if (authLoading || loading) return <DashboardLoading />;

  return (
    <>
      <DashboardLayout>
        <PageHeader
          title="Histórico de Coletas"
          subtitle="Visualize seus envios anteriores"
        />

        <div className="p-6 md:p-8 max-w-5xl mx-auto">
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
                          {new Date(item.collectionDate).toLocaleDateString("pt-BR", { timeZone: "UTC" })}
                        </td>
                        <td className="px-6 py-4 text-brand-primary font-bold">
                          {item.quantity} L
                        </td>
                         <td className="px-6 py-4 text-gray-600">
                           {item.numAnimals}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Recebido
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => setSelectedCollection(item)}
                            className="text-sm font-medium text-[#d97706] hover:text-[#b45309] hover:underline"
                          >
                            Ver Detalhes
                          </button>
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
    </>
  );
}
