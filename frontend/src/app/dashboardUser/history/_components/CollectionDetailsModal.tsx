import React, { useEffect } from 'react';
import { X, Milk } from 'lucide-react';
import { DailyCollection } from '@/interfaces/daily-collection';
import { formatDateBR } from "@/utils/date";
import { ICON_SIZES } from "@/constants/ui";

interface CollectionDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  collection: DailyCollection | null;
}

export function CollectionDetailsModal({ isOpen, onClose, collection }: CollectionDetailsModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  if (!isOpen || !collection) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="collection-details-title"
      >
        <header className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-[#fdfbf7]">
          <div className="flex items-center gap-2">
            <Milk className="text-[#d97706]" size={ICON_SIZES.MD} />
            <div>
            <h3 id="collection-details-title" className="text-lg font-bold text-[#1e3a29]">Detalhes da Coleta</h3>
              <p className="text-sm text-slate-500">
                {new Date(collection.collectionDate).toLocaleDateString("pt-BR", { timeZone: "UTC" })}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
            aria-label="Fechar modal"
          >
            <X size={ICON_SIZES.SM} />
          </button>
        </header>

        <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <p className="text-xs text-slate-500 uppercase font-bold">Total</p>
                    <p className="text-lg font-bold text-brand-primary">{collection.quantity} L</p>
                </div>
                 <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <p className="text-xs text-slate-500 uppercase font-bold">Animais</p>
                    <p className="text-lg font-bold text-[#1e3a29]">{collection.numAnimals}</p>
                </div>
                 <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <p className="text-xs text-slate-500 uppercase font-bold">Ordenhas</p>
                    <p className="text-lg font-bold text-[#1e3a29]">{collection.numOrdens}</p>
                </div>
                 <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <p className="text-xs text-slate-500 uppercase font-bold">Ração</p>
                    <p className="text-lg font-bold text-[#1e3a29]">
                        {collection.rationProvided ? 'Sim' : 'Não'}
                    </p>
                </div>
            </div>

          <h4 className="font-bold text-[#1e3a29] mb-4 flex items-center gap-2">
            <span className="w-1.5 h-6 bg-[#d97706] rounded-full"></span>
            Produção por Animal
          </h4>

          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 font-semibold text-slate-600">Animal</th>
                   <th className="px-4 py-3 font-semibold text-slate-600 text-right">Quantidade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {collection.items && collection.items.length > 0 ? (
                  collection.items.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-medium text-slate-800">
                        {item.animal ? item.animal.name : `Animal #${item.animalId}`}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-brand-primary">
                        {item.quantity} L
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={2} className="px-4 py-8 text-center text-slate-400 italic">
                      Detalhes não disponíveis para esta coleta.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <footer className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-white border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
          >
            Fechar
          </button>
        </footer>
      </div>
    </div>
  );
}
