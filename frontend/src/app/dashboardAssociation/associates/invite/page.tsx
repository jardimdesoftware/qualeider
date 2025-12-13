"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Send } from "lucide-react";
import Link from "next/link";
import { associationService } from "@/services/associationService";
import { inviteService } from "@/services/inviteService";
import DashboardLoading from "@/components/dashboard/DashboardLoading";
import ErrorModal from "@/components/ui/error-modal";

export default function InviteProducerPage() {
  const [producers, setProducers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inviting, setInviting] = useState<number | null>(null);
  const [associationId, setAssociationId] = useState<number | null>(null);

  useEffect(() => {
    // Get Association ID from token
    const token = localStorage.getItem("authToken");
    if (token) {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            setAssociationId(payload.sub);
        } catch (e) {
            console.error("Error decoding token", e);
        }
    }

    const fetchProducers = async () => {
      try {
        const data = await associationService.getAvailableProducers();
        setProducers(data);
      } catch (err) {
        console.error("Erro ao buscar produtores:", err);
        setError("Não foi possível carregar a lista de produtores.");
      } finally {
        setLoading(false);
      }
    };

    fetchProducers();
  }, []);

  const handleInvite = async (userId: number) => {
    if (!associationId) {
        setError("Erro de autenticação. Recarregue a página.");
        return;
    }

    setInviting(userId);
    try {
      await inviteService.createInvite(associationId, userId, "Você foi convidado para participar da nossa associação.");
      // Remove from list or show success
      // setProducers(prev => prev.filter(p => p.id !== userId)); // Optional: remove if we want to prevent double invite immediately
      alert("Convite enviado com sucesso!");
    } catch (err: any) {
      console.error("Erro ao enviar convite:", err);
      // alert("Erro ao vincular produtor.");
      setError(err.response?.data?.message || "Erro ao enviar convite.");
    } finally {
      setInviting(null);
    }
  };

  if (loading) return <DashboardLoading />;

  return (
    <main className="p-6 md:p-8 max-w-7xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/dashboardAssociation/associates" className="p-2 hover:bg-slate-100 rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6 text-slate-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[#1e3a29]">Convidar Produtor</h1>
          <p className="text-slate-500">Envie convites para produtores participarem da sua associação</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      {producers.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200 shadow-sm">
          <p className="text-slate-500">Nenhum produtor disponível encontrado para convite.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-[#f8fafc] border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-semibold text-[#1e3a29]">Nome</th>
                <th className="px-6 py-4 font-semibold text-[#1e3a29]">Cidade/UF</th>
                <th className="px-6 py-4 font-semibold text-[#1e3a29]">Fazenda</th>
                <th className="px-6 py-4 font-semibold text-[#1e3a29] text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {producers.map((producer) => (
                <tr key={producer.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-800">{producer.name}</div>
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    {producer.city} - {producer.state}
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    {producer.farmName || "-"}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleInvite(producer.id)}
                      disabled={inviting === producer.id}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-[#1e3a29] text-white rounded-lg hover:bg-[#14281d] transition-colors disabled:opacity-70"
                    >
                      <Send className="w-4 h-4" />
                      {inviting === producer.id ? "Enviando..." : "Convidar"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      <ErrorModal isOpen={!!error && false} onClose={() => setError(null)} message={error || ''} />
    </main>
  );
}
