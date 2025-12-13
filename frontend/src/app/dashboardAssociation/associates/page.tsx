"use client";

import { useEffect, useState } from "react";
import { AssociationHeader } from "@/components/dashboard/association/AssociationHeader";
import { AssociationFilterBar } from "@/components/dashboard/association/AssociationFilterBar";
import { AssociateCard, AssociateProps } from "@/components/dashboard/association/AssociateCard";
import DashboardLoading from "@/components/dashboard/DashboardLoading";
import { associationService } from "@/services/associationService";
import ErrorModal from "@/components/ui/error-modal";

export default function AssociatesPage() {
  const [associates, setAssociates] = useState<AssociateProps[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchAssociates = async () => {
      setLoading(true);
      try {
        const response = await associationService.getAssociates(currentPage, itemsPerPage);
        // Backend returns { data: [], total: number }
        const { data, total } = response;
        
        const formattedAssociates: AssociateProps[] = data.map((item: any) => ({
          name: item.name,
          farmName: item.farmName || "Fazenda não informada",
          location: `${item.city}, ${item.state}`,
          status: item.status === "Active" ? "Ativo" : "Pendente",
          lastAccess: item.lastAccess 
            ? new Date(item.lastAccess).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
            : "Nunca",
          animalsCount: item.animalsCount,
          dailyProduction: item.dailyProduction ? `${item.dailyProduction}L` : null,
          initials: item.name.split(' ').map((n: string) => n[0]).join('').substring(0,2).toUpperCase()
        }));
        
        setAssociates(formattedAssociates);
        setTotalItems(total);
        setTotalPages(Math.ceil(total / itemsPerPage));
      } catch (err: any) {
        console.error("Erro ao buscar associados:", err);
        setError("Não foi possível carregar a lista de associados.");
      } finally {
        setLoading(false);
      }
    };

    fetchAssociates();
  }, [currentPage]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  if (loading) return <DashboardLoading />;

  return (
    <main className="flex-1 overflow-y-auto">
      <AssociationHeader totalAssociates={totalItems} />

      <div className="p-6 md:p-8 max-w-7xl mx-auto">
        <AssociationFilterBar />

        {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-4">
                {error}
            </div>
        )}

        {/* Lista de Cards (Associados) */}
        {!error && associates.length === 0 ? (
            <div className="text-center py-10 text-slate-500">
                Nenhum associado encontrado.
            </div>
        ) : (
            <div className="space-y-4">
            {associates.map((associate, index) => (
                <AssociateCard key={index} {...associate} />
            ))}
            </div>
        )}

        {/* Paginação */}
        {totalPages > 1 && (
            <div className="mt-8 flex justify-center gap-2 items-center">
                <button 
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>
                
                <span className="text-sm text-slate-600 font-medium px-2">
                  Página {currentPage} de {totalPages}
                </span>

                <button 
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Próximo
                </button>
            </div>
        )}
      </div>
      
      {/* Modal de Erro Global (opcional se usar state local) */}
      <ErrorModal isOpen={!!error && false} onClose={() => setError(null)} message={error || ''} />
    </main>
  );
}
