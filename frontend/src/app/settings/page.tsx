"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/siedbar";
import { apiBase } from "@/services/baseApi";
import { Estado, Cidade } from "@/interfaces/location";
import { User } from "@/interfaces/user";
import { USER_CATEGORIES, sortByNamePtBr } from "@/constants/user-options";

export default function Settings() {
  const router = useRouter();
  const [userRole, setUserRole] = useState<"Admin" | "Common">("Common");
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
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      setUserRole(payload.role);
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

  // Buscar dados do usuário pelo ID
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
      setErrorMessage("Erro ao carregar dados do usuário.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};
    if (!formData.name) newErrors.name = "Nome é obrigatório";
    if (!formData.email) newErrors.email = "Email é obrigatório";
    if (!formData.userCategory)
      newErrors.userCategory = "Categoria é obrigatória";
    if (!formData.state) newErrors.state = "Estado é obrigatório";
    if (!formData.city) newErrors.city = "Cidade é obrigatória";
    if (userRole === "Common" && !formData.userType)
      newErrors.userType = "Tipo de usuário é obrigatório para Common";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setShowConfirmationModal(true);
  };

  const handleConfirm = async () => {
    setShowConfirmationModal(false);

    const userData = {
      ...formData,
      userType: userRole === "Admin" ? null : formData.userType,
    };

    try {
      const token = localStorage.getItem("authToken");

      if (!token) {
        setErrorMessage("Token de autenticação não encontrado.");
        return;
      }

      const payload = JSON.parse(atob(token.split(".")[1]));

      if (!payload || !payload.sub) {
        setErrorMessage("Token inválido ou malformado.");
        return;
      }

      const userId = parseInt(payload.sub, 10);

      if (isNaN(userId)) {
        setErrorMessage("ID do usuário inválido.");
        return;
      }

      const response = await apiBase.patch(`/users/${userId}`, userData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 200) {
        setSuccessMessage("Dados atualizados com sucesso!");
        setInitialFormData({ ...formData });
      } else {
        setErrorMessage("Erro ao atualizar dados.");
      }
    } catch (err) {
      console.error("Erro ao atualizar dados:", err);
      setErrorMessage("Erro ao atualizar dados.");
    }
  };

  const handleCancel = () => {
    setShowConfirmationModal(false);
    setFormData({ ...initialFormData });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-10 h-10 border-4 border-green-700 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row">
      <Sidebar />
      <div className="flex-1 p-8">
        <h1 className="text-2xl font-bold mb-6 mt-12 md:mt-4">Configurações</h1>

        {/* Mensagem de sucesso */}
        {successMessage && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
            {successMessage}
          </div>
        )}

        {/* Mensagem de erro */}
        {errorMessage && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Categoria (apenas para Common) */}
          {userRole === "Common" && (
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Categoria <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.userType}
                onChange={(e) =>
                  setFormData({ ...formData, userType: e.target.value })
                }
                className="w-full p-2 border border-gray-300 rounded-lg"
              >
                <option value="">Selecione uma categoria</option>
                {USER_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat === "Associacao" ? "Associação" : cat}
                  </option>
                ))}
              </select>
              {errors.userType && (
                <p className="text-red-500 text-sm">{errors.userType}</p>
              )}
            </div>
          )}

          {/* Pessoa J ou F */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Pessoa <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.userCategory}
              onChange={(e) =>
                setFormData({ ...formData, userCategory: e.target.value })
              }
              className="w-full p-2 border border-gray-300 rounded-lg"
            >
              <option value="">Selecione um tipo</option>
              <option value="Fisica">Física</option>
              <option value="Juridica">Jurídica</option>
            </select>
            {errors.userCategory && (
              <p className="text-red-500 text-sm">{errors.userCategory}</p>
            )}
          </div>

          {/* Nome e Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Nome <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full p-2 border border-gray-300 rounded-lg"
            />
            {errors.name && (
              <p className="text-red-500 text-sm">{errors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="w-full p-2 border border-gray-300 rounded-lg"
            />
            {errors.email && (
              <p className="text-red-500 text-sm">{errors.email}</p>
            )}
          </div>

          {/* Estado e Cidade */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Estado <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.state}
                onChange={(e) =>
                  setFormData({ ...formData, state: e.target.value, city: "" })
                }
                className="w-full p-2 border border-gray-300 rounded-lg"
              >
                <option value="">Selecione um estado</option>
                {estados.map((estado) => (
                  <option key={estado.id} value={estado.sigla}>
                    {estado.nome}
                  </option>
                ))}
              </select>
              {errors.state && (
                <p className="text-red-500 text-sm">{errors.state}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Cidade <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.city}
                onChange={(e) =>
                  setFormData({ ...formData, city: e.target.value })
                }
                className="w-full p-2 border border-gray-300 rounded-lg"
                disabled={!formData.state}
              >
                <option value="">Selecione uma cidade</option>
                {cidades.map((cidade) => (
                  <option key={cidade.id} value={cidade.nome}>
                    {cidade.nome}
                  </option>
                ))}
              </select>
              {errors.city && (
                <p className="text-red-500 text-sm">{errors.city}</p>
              )}
            </div>
          </div>

          {/* Botão de Salvar */}
          <div>
            <button
              type="submit"
              className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              Salvar
            </button>
          </div>
        </form>

        {/* Popout de confirmação */}
        {showConfirmationModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg text-center">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Confirmar Alterações
              </h2>
              <p className="text-gray-700 mb-4">
                Tem certeza que deseja salvar as alterações?
              </p>
              <div className="flex justify-center gap-4">
                <button
                  onClick={handleCancel}
                  className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirm}
                  className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
