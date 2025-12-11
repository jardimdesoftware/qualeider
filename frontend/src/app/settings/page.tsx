"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout";
import { apiBase } from "@/services/baseApi";
import { Button, InputField, SelectField, ErrorModal } from "@/components/ui";
import { Estado, Cidade } from "@/interfaces/location";
import { User } from "@/interfaces/user";
import { USER_CATEGORIES, sortByNamePtBr } from "@/constants/user-options";
import DashboardLoading from "@/components/dashboard/DashboardLoading";

export default function Settings() {
  const router = useRouter();
  const [userType, setUserType] = useState<"user" | "association" | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    userType: "",
    userCategory: "",
    state: "",
    city: "",
  });
  const [initialFormData, setInitialFormData] = useState({ ...formData });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [estados, setEstados] = useState<Estado[]>([]);
  const [cidades, setCidades] = useState<Cidade[]>([]);
  const [loading, setLoading] = useState(true);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      setUserType(payload.userType);
      fetchUserData(payload.sub);
    } catch (err) {
      console.error("Erro ao decodificar o token:", err);
      router.push("/login");
    }
  }, [router]);

  useEffect(() => {
    if (loading) return;

    const fetchEstados = async () => {
      try {
        const response = await fetch(
          "https://servicodados.ibge.gov.br/api/v1/localidades/estados"
        );
        const data = await response.json();
        setEstados(sortByNamePtBr(data));
      } catch (err) {
        console.error("Erro ao buscar estados:", err);
      }
    };
    fetchEstados();
  }, [loading]);

  useEffect(() => {
    if (loading) return;

    const fetchCidades = async () => {
      if (formData.state) {
        try {
          const response = await fetch(
            `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${formData.state}/municipios`
          );
          const data = await response.json();
          setCidades(sortByNamePtBr(data));
        } catch (err) {
          console.error("Erro ao buscar cidades:", err);
        }
      } else {
        setCidades([]);
      }
    };
    fetchCidades();
  }, [formData.state, loading]);

  const fetchUserData = async (userId: string) => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await apiBase.get<User>(`/users/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const user = response.data;
      setFormData({
        name: user.name,
        email: user.email,
        userType: user.userType || "",
        userCategory: user.userCategory,
        state: user.state,
        city: user.city,
      });
      setInitialFormData({
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

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.name) newErrors.name = "Nome é obrigatório";
    if (!formData.email) newErrors.email = "Email é obrigatório";
    if (!formData.userCategory)
      newErrors.userCategory = "Categoria é obrigatória";
    if (!formData.state) newErrors.state = "Estado é obrigatório";
    if (!formData.city) newErrors.city = "Cidade é obrigatória";
    if (userType === "user" && !formData.userType)
      newErrors.userType = "Tipo de usuário é obrigatório";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setShowConfirmModal(true);
  };

  const handleConfirm = async () => {
    setShowConfirmModal(false);

    const userData = {
      ...formData,
      userType: userType === "association" ? null : formData.userType,
    };

    try {
      const token = localStorage.getItem("authToken");

      if (!token) {
        setModalMessage("Token de autenticação não encontrado.");
        setShowErrorModal(true);
        return;
      }

      const payload = JSON.parse(atob(token.split(".")[1]));

      if (!payload || !payload.sub) {
        setModalMessage("Token inválido ou malformado.");
        setShowErrorModal(true);
        return;
      }

      const userId = parseInt(payload.sub, 10);

      if (isNaN(userId)) {
        setModalMessage("ID do usuário inválido.");
        setShowErrorModal(true);
        return;
      }

      const response = await apiBase.patch(`/users/${userId}`, userData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 200) {
        setModalMessage("Dados atualizados com sucesso!");
        setShowSuccessModal(true);
        setInitialFormData({ ...formData });
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

  const handleCancel = () => {
    setShowConfirmModal(false);
    setFormData({ ...initialFormData });
  };

  if (loading) {
    return <DashboardLoading />;
  }

  const estadoOptions = estados.map((estado) => ({
    value: estado.sigla,
    label: estado.nome,
  }));

  const cidadeOptions = cidades.map((cidade) => ({
    value: cidade.nome,
    label: cidade.nome,
  }));

  const userCategoryOptions = USER_CATEGORIES.map((cat) => ({
    value: cat,
    label: cat === "Associacao" ? "Associação" : cat,
  }));

  return (
    <div className="flex flex-col lg:flex-row bg-[#fdfbf7] min-h-screen">
      <Sidebar />
      <div className="flex-1 overflow-y-auto">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-slate-200 px-6 md:px-8 py-6">
          <h2 className="text-2xl md:text-3xl font-black text-[#1e3a29]">
            Configurações
          </h2>
          <p className="text-slate-500">Atualize suas informações pessoais</p>
        </header>

        <div className="p-6 md:p-8 max-w-3xl mx-auto">
          <div className="bg-white rounded-xl shadow-md border border-slate-100 p-6 md:p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {userType === "user" && (
                <SelectField
                  label="Categoria"
                  value={formData.userType}
                  onChange={(e) =>
                    setFormData({ ...formData, userType: e.target.value })
                  }
                  options={userCategoryOptions}
                  error={errors.userType}
                  required
                />
              )}

              <SelectField
                label="Pessoa"
                value={formData.userCategory}
                onChange={(e) =>
                  setFormData({ ...formData, userCategory: e.target.value })
                }
                options={[
                  { value: "Fisica", label: "Física" },
                  { value: "Juridica", label: "Jurídica" },
                ]}
                error={errors.userCategory}
                required
              />

              <InputField
                label="Nome"
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                error={errors.name}
                required
              />

              <InputField
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                error={errors.email}
                required
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <SelectField
                  label="Estado"
                  value={formData.state}
                  onChange={(e) =>
                    setFormData({ ...formData, state: e.target.value, city: "" })
                  }
                  options={estadoOptions}
                  error={errors.state}
                  required
                />

                <SelectField
                  label="Cidade"
                  value={formData.city}
                  onChange={(e) =>
                    setFormData({ ...formData, city: e.target.value })
                  }
                  options={cidadeOptions}
                  error={errors.city}
                  required
                  disabled={!formData.state}
                />
              </div>

              <div className="pt-4">
                <Button type="submit" variant="primary" fullWidth>
                  Salvar Alterações
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
              <Button onClick={handleCancel} variant="outline" fullWidth>
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
