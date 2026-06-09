"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Tag, Calendar, Dna, Heart, AlertCircle } from "lucide-react";
import { DashboardLayout } from "@/components/layout";
import { PageHeader } from "@/components/dashboard";
import DashboardLoading from "@/components/dashboard/DashboardLoading";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useAnimal } from "@/hooks/queries/useAnimals";
import { useAnimalCollectionHistory } from "@/hooks/queries/useCollections";
import { Status, Animal } from "@/interfaces/animal";
import { CmtResult, AnimalCollectionHistoryItem } from "@/interfaces/daily-collection";

// ─── helpers ────────────────────────────────────────────────────────────────

function animalLabel(a: Animal): string {
  if (a.tagNumber) return `#${a.tagNumber}${a.name ? ` – ${a.name}` : ""}`;
  return a.name || `Animal ID ${a.id}`;
}

function cmtBadge(result: CmtResult | null | undefined) {
  if (!result) return null;
  const styles: Record<CmtResult, string> = {
    [CmtResult.Normal]: "bg-green-100 text-green-800",
    [CmtResult.Suspeito]: "bg-yellow-100 text-yellow-800",
    [CmtResult.Positivo]: "bg-red-100 text-red-800",
  };
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${styles[result]}`}>
      {result}
    </span>
  );
}

// ─── sub-components ──────────────────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs uppercase tracking-wider text-gray-400 font-semibold">{label}</span>
      <span className="text-gray-800 font-medium">{value || "—"}</span>
    </div>
  );
}

function HistoryTable({ rows }: { rows: AnimalCollectionHistoryItem[] }) {
  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-12 text-gray-400">
        <AlertCircle size={32} className="text-gray-300" />
        <p className="text-sm">Nenhuma coleta registrada para este animal.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase text-gray-500 font-semibold tracking-wider">
            <th className="px-5 py-3">Data</th>
            <th className="px-5 py-3">Quantidade (L)</th>
            <th className="px-5 py-3">CMT</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((row) => (
            <tr key={row.collectionId} className="hover:bg-[#fdfbf7] transition-colors">
              <td className="px-5 py-3 text-gray-700 font-medium">
                {new Date(row.collectionDate).toLocaleDateString("pt-BR", { timeZone: "UTC" })}
              </td>
              <td className="px-5 py-3 text-brand-primary font-bold">{row.quantity} L</td>
              <td className="px-5 py-3">{cmtBadge(row.cmtResult) ?? <span className="text-gray-400 text-xs">—</span>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── page ────────────────────────────────────────────────────────────────────

export default function AnimalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { isLoading: authLoading } = useAuthGuard("user");

  const animalId = id ? Number(id) : null;
  const { data: animal, isLoading: animalLoading, isError } = useAnimal(animalId);
  const { data: history = [], isLoading: historyLoading } = useAnimalCollectionHistory(animalId);

  if (authLoading || animalLoading) return <DashboardLoading />;

  if (isError || !animal) {
    return (
      <DashboardLayout>
        <PageHeader title="Animal não encontrado" subtitle="" />
        <div className="p-6 text-center text-gray-500">
          Não foi possível carregar os dados do animal.
        </div>
      </DashboardLayout>
    );
  }

  const isInactive = animal.status === Status.Inactive;
  const totalLiters = history.reduce((sum, h) => sum + h.quantity, 0);

  return (
    <DashboardLayout>
      <PageHeader
        title={animalLabel(animal)}
        subtitle={`${animal.animalSpecies?.name ?? animal.animalType ?? "Animal"} · Perfil`}
      />

      <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6">
        {/* back */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-primary transition-colors"
        >
          <ArrowLeft size={16} />
          Voltar
        </button>

        {/* status badge */}
        {isInactive && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-2.5 text-sm font-medium">
            <AlertCircle size={16} />
            Este animal está inativo e não aparece nas coletas.
          </div>
        )}

        {/* perfil card */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
              <Tag size={18} className="text-amber-600" />
            </div>
            <h2 className="text-base font-semibold text-gray-800">Dados do Animal</h2>
            <span
              className={`ml-auto inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                isInactive ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
              }`}
            >
              {isInactive ? "Inativo" : "Ativo"}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
            <InfoRow label="Brinco / Tag" value={animal.tagNumber ? `#${animal.tagNumber}` : "—"} />
            <InfoRow label="Nome" value={animal.name} />
            <InfoRow label="Espécie" value={animal.animalSpecies?.name ?? animal.animalType} />
            <InfoRow label="Raça" value={animal.animalSpecies?.breeds?.find(b => b.id === animal.breedId)?.name ?? animal.breed} />
            <InfoRow label="Idade" value={animal.age ? `${animal.age} anos` : undefined} />
            <InfoRow
              label="Cadastrado em"
              value={
                animal.createdAt
                  ? new Date(animal.createdAt).toLocaleDateString("pt-BR")
                  : undefined
              }
            />
          </div>
        </div>

        {/* parentesco */}
        {(animal.motherId || animal.motherCode || animal.fatherId || animal.fatherCode) && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center">
                <Dna size={18} className="text-purple-500" />
              </div>
              <h2 className="text-base font-semibold text-gray-800">Parentesco</h2>
            </div>

            <div className="grid grid-cols-2 gap-5">
              <InfoRow
                label="Mãe"
                value={
                  animal.mother
                    ? animalLabel(animal.mother)
                    : animal.motherCode
                    ? `Código externo: ${animal.motherCode}`
                    : undefined
                }
              />
              <InfoRow
                label="Pai"
                value={
                  animal.father
                    ? animalLabel(animal.father)
                    : animal.fatherCode
                    ? `Código externo: ${animal.fatherCode}`
                    : undefined
                }
              />
            </div>
          </div>
        )}

        {/* histórico */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
              <Calendar size={18} className="text-blue-500" />
            </div>
            <h2 className="text-base font-semibold text-gray-800">Histórico de Ordenhas</h2>
            {!historyLoading && history.length > 0 && (
              <span className="ml-auto text-sm text-gray-500">
                <span className="font-semibold text-brand-primary">{totalLiters.toFixed(1)} L</span>{" "}
                em {history.length} coleta{history.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 mb-4">
            <Heart size={13} className="text-red-400" />
            <span className="text-xs text-gray-400">Ordenado por data mais recente</span>
          </div>

          {historyLoading ? (
            <div className="py-8 text-center text-gray-400 text-sm">Carregando histórico…</div>
          ) : (
            <HistoryTable rows={history} />
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
