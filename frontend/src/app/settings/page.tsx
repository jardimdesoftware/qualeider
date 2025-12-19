"use client";

import { useEffect, useState } from "react";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { associationService } from "@/services/associationService";
import { Button, InputField, ErrorModal } from "@/components/ui";
import DashboardLoading from "@/components/dashboard/DashboardLoading";
import { Building2, Save } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const settingsSchema = z.object({
  name: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  tradeName: z.string().optional(),
  email: z.string().email("Email inválido"),
  landlinePhone: z.string().min(10, "Telefone inválido"),
  mobilePhone: z.string().optional(),
  zipCode: z.string().min(8, "CEP inválido"),
  street: z.string().min(3, "Rua inválida"),
  number: z.string().min(1, "Número obrigatório"),
  neighborhood: z.string().min(3, "Bairro obrigatório"),
  city: z.string().min(3, "Cidade obrigatória"),
  state: z.string().length(2, "Estado deve ter 2 letras"),
  presidentName: z.string().min(3, "Nome do presidente inválido"),
  presidentEmail: z.string().email("Email do presidente inválido"),
  presidentPhone: z.string().min(10, "Telefone do presidente inválido"),
});

type SettingsForm = z.infer<typeof settingsSchema>;

export default function SettingsPage() {
  const { userId: associationId, isLoading: authLoading } = useAuthGuard("association");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<SettingsForm>({
    resolver: zodResolver(settingsSchema),
  });

  useEffect(() => {
    if (associationId) {
      loadData();
    }
  }, [associationId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await associationService.findById(associationId!);
      
      // Populate form
      Object.keys(data).forEach((key) => {
        if (key in settingsSchema.shape) {
          setValue(key as any, data[key as keyof typeof data]);
        }
      });
    } catch (err) {
      console.error("Erro ao carregar dados", err);
      setError("Não foi possível carregar os dados da associação.");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: SettingsForm) => {
    try {
      setSaving(true);
      await associationService.update(associationId!, data);
      setSuccessMessage("Dados atualizados com sucesso!");
    } catch (err) {
      console.error("Erro ao salvar", err);
      setError("Erro ao salvar alterações. Verifique os dados e tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) return <DashboardLoading />;

  return (
    <div className="flex-1 overflow-y-auto bg-[#fdfbf7] min-h-screen">
      <header className="bg-white shadow-sm border-b border-slate-200 px-6 md:px-8 py-6">
        <div className="flex items-center gap-3">
          <Building2 className="text-[#1e3a29]" size={28} />
          <div>
            <h2 className="text-2xl md:text-3xl font-black text-[#1e3a29]">
              Configurações
            </h2>
            <p className="text-slate-500">
              Gerencie os dados da sua associação
            </p>
          </div>
        </div>
      </header>
      
      <div className="p-6 md:p-8 max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-md border border-slate-100 p-6 md:p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                
                {/* Dados Gerais */}
                <section>
                    <h3 className="text-lg font-bold text-[#1e3a29] border-b pb-2 mb-4">Dados da Associação</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <InputField label="Razão Social" registration={register("name")} error={errors.name?.message} />
                        <InputField label="Nome Fantasia" registration={register("tradeName")} error={errors.tradeName?.message} />
                        <InputField label="Email Institucional" type="email" registration={register("email")} error={errors.email?.message} disabled />
                        <div className="grid grid-cols-2 gap-4">
                             <InputField label="Telefone Fixo" registration={register("landlinePhone")} error={errors.landlinePhone?.message} />
                             <InputField label="Celular" registration={register("mobilePhone")} error={errors.mobilePhone?.message} />
                        </div>
                    </div>
                </section>

                {/* Endereço */}
                <section>
                    <h3 className="text-lg font-bold text-[#1e3a29] border-b pb-2 mb-4">Endereço</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                         <div className="md:col-span-1">
                            <InputField label="CEP" registration={register("zipCode")} error={errors.zipCode?.message} />
                         </div>
                         <div className="md:col-span-2">
                            <InputField label="Rua" registration={register("street")} error={errors.street?.message} />
                         </div>
                         <div className="grid grid-cols-2 gap-4">
                            <InputField label="Número" registration={register("number")} error={errors.number?.message} />
                            <InputField label="Bairro" registration={register("neighborhood")} error={errors.neighborhood?.message} />
                         </div>
                         <div className="grid grid-cols-2 gap-4">
                            <InputField label="Cidade" registration={register("city")} error={errors.city?.message} />
                            <InputField label="Estado (UF)" registration={register("state")} error={errors.state?.message} maxLength={2} />
                         </div>
                    </div>
                </section>
                
                 {/* Presidente */}
                 <section>
                    <h3 className="text-lg font-bold text-[#1e3a29] border-b pb-2 mb-4">Dados do Presidente</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <InputField label="Nome Completo" registration={register("presidentName")} error={errors.presidentName?.message} />
                        <InputField label="Email" type="email" registration={register("presidentEmail")} error={errors.presidentEmail?.message} />
                        <InputField label="Telefone" registration={register("presidentPhone")} error={errors.presidentPhone?.message} />
                    </div>
                </section>

                <div className="flex justify-end pt-4">
                    <Button type="submit" variant="primary" loading={saving} className="w-full md:w-auto px-8">
                        <Save className="mr-2 h-4 w-4" />
                        SALVAR ALTERAÇÕES
                    </Button>
                </div>
            </form>
        </div>
      </div>

      <ErrorModal
        isOpen={!!successMessage}
        onClose={() => setSuccessMessage(null)}
        title="Sucesso"
        message={successMessage || ""}
        type="success"
      />

      <ErrorModal
        isOpen={!!error}
        onClose={() => setError(null)}
        title="Erro"
        message={error || ""}
        type="error"
      />
    </div>
  );
}
