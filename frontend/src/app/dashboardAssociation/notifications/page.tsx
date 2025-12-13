"use client";

import { useState, useEffect } from "react";
import { Button, InputField, SelectField, ErrorModal } from "@/components/ui";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { notificationService } from "@/services/notificationService";
import { associationService } from "@/services/associationService";
import { NotificationType } from "@/interfaces/notification";
import DashboardLoading from "@/components/dashboard/DashboardLoading";
import { Bell } from "lucide-react";

export default function NotificationsPage() {
  const { userId: associationId, isLoading: authLoading } = useAuthGuard("association");
  const [loading, setLoading] = useState(false);
  const [producers, setProducers] = useState<any[]>([]);
  
  // Form State
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState<NotificationType>(NotificationType.COLLECTIVE);
  const [selectedProducers, setSelectedProducers] = useState<number[]>([]);
  
  // UI State
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [isProducerDropdownOpen, setIsProducerDropdownOpen] = useState(false);

  useEffect(() => {
    if (associationId) {
      fetchProducers();
    }
  }, [associationId]);

  const fetchProducers = async () => {
    try {
      // Using existing service to get associates. 
      // Note: getAssociates returns paginated data. Ideally we need an endpoint for 'all' or we paginate here.
      // For now, we'll request a larger limit to get most of them, or we should fallback to another endpoint if available.
      // associations.controller.ts has getAssociates (paginated).
      // We might need to iterate or increase limit. Let's try limit 100 for now.
      const response = await associationService.getAssociates(1, 100);
      setProducers(response.data || []);
    } catch (error) {
      console.error("Erro ao buscar produtores", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!subject || !message) {
      setModalMessage("Preencha todos os campos obrigatórios.");
      setShowErrorModal(true);
      return;
    }

    if (type === NotificationType.INDIVIDUAL && selectedProducers.length === 0) {
      setModalMessage("Selecione pelo menos um produtor.");
      setShowErrorModal(true);
      return;
    }

    setLoading(true);

    try {
      await notificationService.send({
        associationId: associationId!,
        subject,
        message,
        type,
        userIds: type === NotificationType.INDIVIDUAL ? selectedProducers : undefined,
      });

      setModalMessage("Notificação enviada com sucesso!");
      setShowSuccessModal(true);
      
      // Reset form
      setSubject("");
      setMessage("");
      setType(NotificationType.COLLECTIVE);
      setSelectedProducers([]);
    } catch (error) {
      console.error("Erro ao enviar notificação:", error);
      setModalMessage("Erro ao enviar notificação. Tente novamente.");
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  const toggleProducer = (id: number) => {
    setSelectedProducers(prev => 
      prev.includes(id) 
        ? prev.filter(pId => pId !== id)
        : [...prev, id]
    );
  };

  const toggleAllProducers = () => {
    if (selectedProducers.length === producers.length) {
      setSelectedProducers([]);
    } else {
      setSelectedProducers(producers.map(p => p.id));
    }
  };

  if (authLoading) return <DashboardLoading />;

  return (
    <div className="flex-1 overflow-y-auto">
      <header className="bg-white shadow-sm border-b border-slate-200 px-6 md:px-8 py-6">
        <div className="flex items-center gap-3">
           <Bell className="text-[#1e3a29]" size={28} />
           <div>
              <h2 className="text-2xl md:text-3xl font-black text-[#1e3a29]">
                  Notificações
              </h2>
              <p className="text-slate-500">Envie comunicados para seus produtores</p>
           </div>
        </div>
      </header>

      <div className="p-6 md:p-8 max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-md border border-slate-100 p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <SelectField
                  label="Tipo de Envio"
                  value={type}
                  onChange={(e) => setType(e.target.value as NotificationType)}
                  options={[
                      { value: NotificationType.COLLECTIVE, label: "Coletivo (Todos os Produtores)" },
                      { value: NotificationType.INDIVIDUAL, label: "Individual (Selecionar Produtores)" },
                  ]}
              />
              
              {/* Custom MultiSelect for Producers */}
              {type === NotificationType.INDIVIDUAL && (
                  <div className="space-y-1 relative">
                      <label className="text-brand-primary font-medium text-sm">Destinatários</label>
                      <div 
                          className="w-full h-11 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm shadow-sm cursor-pointer flex items-center justify-between"
                          onClick={() => setIsProducerDropdownOpen(!isProducerDropdownOpen)}
                      >
                          <span>
                              {selectedProducers.length === 0 
                                  ? "Selecione..." 
                                  : `${selectedProducers.length} produtor(es) selecionado(s)`}
                          </span>
                          <span className="text-gray-400">▼</span>
                      </div>
                      
                      {isProducerDropdownOpen && (
                          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                              <div 
                                  className="px-4 py-2 hover:bg-gray-50 cursor-pointer font-semibold text-brand-primary border-b border-gray-100"
                                  onClick={toggleAllProducers}
                              >
                                  {selectedProducers.length === producers.length ? "Desmarcar Todos" : "Selecionar Todos"}
                              </div>
                              {producers.map(producer => (
                                  <div 
                                      key={producer.id} 
                                      className="px-4 py-2 hover:bg-gray-50 cursor-pointer flex items-center gap-2"
                                      onClick={() => toggleProducer(producer.id)}
                                  >
                                      <input 
                                          type="checkbox" 
                                          checked={selectedProducers.includes(producer.id)}
                                          readOnly
                                          className="rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
                                      />
                                      <span className="truncate">{producer.name}</span>
                                  </div>
                              ))}
                              {producers.length === 0 && (
                                  <div className="px-4 py-2 text-gray-500 text-center">Nenhum produtor encontrado</div>
                              )}
                          </div>
                      )}
                      {/* Overlay to close dropdown */}
                      {isProducerDropdownOpen && (
                          <div 
                              className="fixed inset-0 z-0" 
                              onClick={() => setIsProducerDropdownOpen(false)}
                          />
                      )}
                  </div>
              )}
            </div>

            <InputField
              label="Assunto"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Ex: Aviso de Coleta"
              required
            />

            <div className="space-y-1">
              <label className="text-brand-primary font-medium text-sm">Mensagem</label>
              <textarea
                  className="w-full min-h-[150px] rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm shadow-sm 
                  focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                  placeholder="Digite sua mensagem aqui..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
              />
            </div>

            <div className="pt-4 flex justify-end">
              <Button
                type="submit"
                variant="primary"
                disabled={loading}
                className="w-full md:w-auto px-8"
              >
                {loading ? "ENVIANDO..." : "ENVIAR NOTIFICAÇÃO"}
              </Button>
            </div>

          </form>
        </div>
      </div>

      <ErrorModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Sucesso"
        message={modalMessage}
        type="success"
      />
      <ErrorModal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        title="Erro"
        message={modalMessage}
        type="error"
      />
    </div>
  );
}

