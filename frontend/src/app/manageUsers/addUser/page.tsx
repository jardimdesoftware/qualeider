"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/sidebar";
import { apiBase } from "@/services/baseApi";
import { Eye, EyeOff } from "lucide-react";
import { Estado, Cidade } from "@/interfaces/location";
import { USER_CATEGORIES, sortByNamePtBr } from "@/constants/user-options";
import DashboardLoading from "@/components/dashboard/DashboardLoading";

export default function AddUser() {
  const router = useRouter();
  const [userRole, setUserRole] = useState<"Admin" | "Common">("Common");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
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
  const [showPassword, setShowPassword] = useState(false);
  const [modalMessage, setModalMessage] = useState<string | null>(null);

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

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      password: "",
      role: "Common",
      userType: "",
      userCategory: "",
      state: "",
      city: "",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};
    if (!formData.name) newErrors.name = "Nome é obrigatório";
    if (!formData.email) newErrors.email = "Email é obrigatório";
    if (!formData.password) newErrors.password = "Senha é obrigatória";
    if (formData.password.length < 6)
      newErrors.password = "A senha deve ter no mínimo 6 dígitos";
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

    const userData = {
      ...formData,
      role: userRole,
    };

    try {
      const token = localStorage.getItem("authToken");
      const response = await apiBase.post("/users", userData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 201) {
        setModalMessage("Cadastro realizado com sucesso!");
      } else {
        setModalMessage("Erro ao cadastrar usuário");
        resetForm();
      }
    } catch (err) {
      console.error("Erro ao cadastrar usuário:", err);
      setModalMessage("Erro ao cadastrar usuário");
      resetForm();
    }
  };

  const closeModal = () => {
    setModalMessage(null);
    if (modalMessage === "Cadastro realizado com sucesso!") {
      router.push("/manageUsers");
    }
  };

  if (loading) {
    return <DashboardLoading />;
  }

  return (
    <div className="flex flex-col lg:flex-row">
      <Sidebar />
      <div className="flex-1 p-8">
        <h1 className="text-2xl font-bold mb-6 mt-12 md:mt-4">
          Adicionar Usuário
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

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Senha <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className="w-full p-2 border border-gray-300 rounded-lg pr-10"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {errors.password && (
              <p className="text-red-500 text-sm">{errors.password}</p>
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

          {/* Botões de Cadastrar e Cancelar */}
          <div className="flex gap-4">
            <button
              type="submit"
              className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              Cadastrar
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

        {/* Modal de sucesso/erro */
        /*Ajietar design                                     --------------------------- */}
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
