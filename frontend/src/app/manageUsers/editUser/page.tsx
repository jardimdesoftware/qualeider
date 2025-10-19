"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Sidebar from "@/components/siedbar";
import { apiBase } from "@/services/baseApi";
import { Estado, Cidade } from "@/interfaces/location";
import { User } from "@/interfaces/user";
import { USER_CATEGORIES, sortByNamePtBr } from "@/constants/user-options";

export default function EditUser() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get("id"); // Obtém o ID do usuário da URL

  const [userRole, setUserRole] = useState<"Admin" | "Common">("Common");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "Common",
    userType: "",
    userCategory: "",
    state: "",
    city: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [estados, setEstados] = useState<Estado[]>([]);
  const [cidades, setCidades] = useState<Cidade[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalMessage, setModalMessage] = useState<string | null>(null);

  // Verificar autenticação e permissão ao carregar a página
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      if (payload.role !== "Admin") {
        router.push("/");
      } else {
        setLoading(false);
      }
    } catch (err) {
      console.error("Erro ao decodificar o token:", err);
      router.push("/login");
    }
  }, [router]);

  // Buscar estados ao carregar a página
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

  // Buscar cidades quando o estado é selecionado
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
  useEffect(() => {
    if (!userId) return;

    const fetchUser = async () => {
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
          role: user.role,
          userType: user.userType || "",
          userCategory: user.userCategory,
          state: user.state,
          city: user.city,
        });
        setUserRole(user.role);
      } catch (err) {
        console.error("Erro ao buscar usuário:", err);
        setModalMessage("Erro ao carregar dados do usuário.");
      }
    };

    fetchUser();
  }, [userId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validação dinâmica
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

    // Preparar dados para enviar à API
    const userData = {
      ...formData,
      role: userRole,
      userType: userRole === "Admin" ? null : formData.userType,
    };

    try {
      const token = localStorage.getItem("authToken");
      const response = await apiBase.patch(`/users/${userId}`, userData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 200) {
        setModalMessage("Usuário atualizado com sucesso!");
      } else {
        setModalMessage("Erro ao atualizar usuário.");
      }
    } catch (err) {
      console.error("Erro ao atualizar usuário:", err);
      setModalMessage("Erro ao atualizar usuário.");
    }
  };

  const closeModal = () => {
    setModalMessage(null);
    if (modalMessage === "Usuário atualizado com sucesso!") {
      router.push("/manageUsers");
    }
    // Redireciona para /manageUsers se o erro for ao carregar os dados do usuário
    if (modalMessage === "Erro ao carregar dados do usuário.") {
      router.push("/manageUsers");
    }
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
        <h1 className="text-2xl font-bold mb-6 mt-12 md:mt-4">
          Editar Usuário
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tipo de Usuário e Categoria lado a lado */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Nivel de Acesso <span className="text-red-500">*</span>
              </label>
              <select
                value={userRole}
                onChange={(e) =>
                  setUserRole(e.target.value as "Admin" | "Common")
                }
                className="w-full p-2 border border-gray-300 rounded-lg"
              >
                <option value="Admin">Admin</option>
                <option value="Common">Usuário Comum</option>
              </select>
            </div>
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
          </div>

          {/* Campo específico para Common */}
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

          {/* Nome, Email e Senha */}
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

          {/* Estado e Cidade lado a lado */}
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

          {/* Botões de Salvar e Cancelar */}
          <div className="flex gap-4">
            <button
              type="submit"
              className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              Salvar
            </button>
            <button
              type="button"
              onClick={() => router.push("/manageUsers")}
              className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>

        {/* Modal de sucesso/erro */}
        {modalMessage && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-6 rounded-lg">
              <p>{modalMessage}</p>
              <button
                onClick={closeModal}
                className="mt-4 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
              >
                OK
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
