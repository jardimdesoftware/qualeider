"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Sidebar } from "@/components/layout";
import { Button, InputField, SelectField, ErrorModal } from "@/components/ui";
import { USER_CATEGORIES } from "@/constants/user-options";
import DashboardLoading from "@/components/dashboard/DashboardLoading";
import { settingsSchema, SettingsData } from "@/schemas/profile";
import { useLocation } from "@/hooks/useLocation";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { userService } from "@/services/userService";

export default function Settings() {
  const router = useRouter();
  const { userId, isLoading: authLoading } = useAuthGuard("user");
  
  const [userType, setUserType] = useState<"user" | "association" | null>(null);
  const [loading, setLoading] = useState(true);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SettingsData>({
    resolver: zodResolver(settingsSchema),
    mode: "onBlur",
  });

  const selectedState = watch("state");
  const { estados, cidades, isLoadingCities } = useLocation(selectedState);

  useEffect(() => {
    if (!userId) return;

    const fetchUserData = async () => {
      try {
        const user = await userService.getById(userId);
        // Convert UserType to "user" | "association" | null
        const mappedUserType = user.userType === undefined 
          ? null 
          : (user.userType.toLowerCase() === "associacao" ? "association" : "user");
        setUserType(mappedUserType as "user" | "association" | null);
        reset({
          name: user.name,
          email: user.email,
          userType: user.userType || "",
          userCategory: user.userCategory,
          state: user.state,
          city: user.city,
        });
        setLoading(false);
      } catch (err) {
        console.error("Erro ao buscar usuário:", err);
        setModalMessage("Erro ao carregar dados do usuário.");
        setShowErrorModal(true);
      }
    };

    fetchUserData();
  }, [userId, reset]);

  const onSubmit = async (data: SettingsData) => {
    setShowConfirmModal(true);
  };

  const handleConfirm = async () => {
    setShowConfirmModal(false);

    const formValues = watch();
    const userData = {
      ...formValues,
      userType: userType === "association" ? undefined : formValues.userType,
    };

    if (!userId) {
      setModalMessage("Usuário não autenticado.");
      setShowErrorModal(true);
      return;
    }

    try {
      const response = await userService.update(userId, userData);

      if (response.status === 200) {
        setModalMessage("Dados atualizados com sucesso!");
        setShowSuccessModal(true);
      } else {
        setModalMessage("Erro ao atualizar dados.");
        setShowErrorModal(true);
      }
    } catch (err) {
      console.error("Erro ao atualizar dados:", err);
      setModalMessage("Erro ao atualizar dados.");
      setShowErrorModal(true);
    }
  };

  const estadoOptions = estados.map((e) => ({
    value: e.sigla,
    label: e.nome,
  }));

  const cidadeOptions = cidades.map((c) => ({
    value: c.nome,
    label: c.nome,
  }));

  const userCategoryOptions = USER_CATEGORIES.map((cat) => ({
    value: cat,
    label: cat === "Associacao" ? "Associação" : cat,
  }));

  if (authLoading || loading) {
    return <DashboardLoading />;
  }

  return (
    <div className="flex flex-col lg:flex-row bg-[#fdfbf7] min-h-screen">
      <Sidebar />
      <div className="flex-1 overflow-y-auto">
        <header className="bg-white shadow-sm border-b border-slate-200 px-6 md:px-8 py-6">
          <h2 className="text-2xl md:text-3xl font-black text-[#1e3a29]">
            Configurações
          </h2>
          <p className="text-slate-500">Atualize suas informações pessoais</p>
        </header>

        <div className="p-6 md:p-8 max-w-3xl mx-auto">
          <div className="bg-white rounded-xl shadow-md border border-slate-100 p-6 md:p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {userType === "user" && (
                <SelectField
                  label="Categoria"
                  disabled={isSubmitting}
                  error={errors.userType?.message}
                  {...register("userType")}
                  options={userCategoryOptions}
                />
              )}

              <SelectField
                label="Pessoa"
                disabled={isSubmitting}
                error={errors.userCategory?.message}
                {...register("userCategory")}
                options={[
                  { value: "Fisica", label: "Física" },
                  { value: "Juridica", label: "Jurídica" },
                ]}
              />

              <InputField
                label="Nome"
                type="text"
                disabled={isSubmitting}
                error={errors.name?.message}
                {...register("name")}
              />

              <InputField
                label="Email"
                type="email"
                disabled={isSubmitting}
                error={errors.email?.message}
                {...register("email")}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <SelectField
                  label="Estado"
                  disabled={isSubmitting}
                  error={errors.state?.message}
                  {...register("state")}
                  options={estadoOptions}
                  onChange={(e) => {
                    setValue("state", e.target.value);
                    setValue("city", "");
                  }}
                />

                <SelectField
                  label="Cidade"
                  disabled={isSubmitting || !selectedState}
                  error={errors.city?.message}
                  {...register("city")}
                  options={cidadeOptions}
                />
              </div>

              <div className="pt-4">
                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "SALVANDO..." : "SALVAR ALTERAÇÕES"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
          <div className="bg-white p-6 rounded-2xl shadow-2xl max-w-sm w-full">
            <h2 className="text-xl font-bold text-[#1e3a29] mb-2">
              Confirmar Alterações
            </h2>
            <p className="text-gray-600 mb-6">
              Tem certeza que deseja salvar as alterações?
            </p>
            <div className="flex gap-3">
              <Button
                onClick={() => setShowConfirmModal(false)}
                variant="outline"
                fullWidth
              >
                Cancelar
              </Button>
              <Button onClick={handleConfirm} variant="primary" fullWidth>
                Confirmar
              </Button>
            </div>
          </div>
        </div>
      )}

      <ErrorModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Sucesso!"
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
