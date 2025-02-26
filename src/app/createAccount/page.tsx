"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Logo from "@/assets/Logo.png";
import Button from "@/components/global/button";
import Wave from "@/components/global/waveFooter";
import { Eye, EyeOff } from "lucide-react";
import { apiBase } from "@/services/baseApi";

interface Estado {
  id: number;
  sigla: string;
  nome: string;
}

interface Cidade {
  id: number;
  nome: string;
}

export default function CreateAccount() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    userType: "",
    userCategory: "",
    state: "",
    city: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [estados, setEstados] = useState<Estado[]>([]);
  const [cidades, setCidades] = useState<Cidade[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Verifica o tamanho da tela
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  // Busca estados ao carregar o componente
  useEffect(() => {
    const fetchEstados = async () => {
      try {
        const response = await fetch(
          "https://servicodados.ibge.gov.br/api/v1/localidades/estados"
        );
        const data = await response.json();
        setEstados(data);
      } catch (err) {
        console.error("Erro ao buscar estados:", err);
      }
    };
    fetchEstados();
  }, []);

  // Busca cidades quando o estado é selecionado
  useEffect(() => {
    const fetchCidades = async () => {
      if (formData.state) {
        try {
          const response = await fetch(
            `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${formData.state}/municipios`
          );
          const data = await response.json();
          setCidades(data);
        } catch (err) {
          console.error("Erro ao buscar cidades:", err);
        }
      } else {
        setCidades([]);
      }
    };
    fetchCidades();
  }, [formData.state]);

  // Funções de validação dinâmica
  const validateName = (name: string) => {
    if (!name) {
      setErrors((prev) => ({ ...prev, name: "Nome é obrigatório" }));
    } else {
      setErrors((prev) => ({ ...prev, name: "" }));
    }
  };

  const validateEmail = (email: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setErrors((prev) => ({ ...prev, email: "Email é obrigatório" }));
    } else if (!regex.test(email)) {
      setErrors((prev) => ({ ...prev, email: "Email inválido" }));
    } else {
      setErrors((prev) => ({ ...prev, email: "" }));
    }
  };

  const validateUserType = (userType: string) => {
    if (!userType) {
      setErrors((prev) => ({ ...prev, userType: "Tipo de pessoa é obrigatório" }));
    } else {
      setErrors((prev) => ({ ...prev, userType: "" }));
    }
  };

  const validateUserCategory = (userCategory: string) => {
    if (!userCategory) {
      setErrors((prev) => ({ ...prev, userCategory: "Categoria é obrigatória" }));
    } else {
      setErrors((prev) => ({ ...prev, userCategory: "" }));
    }
  };

  const validateState = (state: string) => {
    if (!state) {
      setErrors((prev) => ({ ...prev, state: "Estado é obrigatório" }));
    } else {
      setErrors((prev) => ({ ...prev, state: "" }));
    }
  };

  const validateCity = (city: string) => {
    if (!city) {
      setErrors((prev) => ({ ...prev, city: "Cidade é obrigatória" }));
    } else {
      setErrors((prev) => ({ ...prev, city: "" }));
    }
  };

  const validatePassword = (password: string) => {
    if (!password) {
      setErrors((prev) => ({ ...prev, password: "Senha é obrigatória" }));
    } else if (password.length < 6) {
      setErrors((prev) => ({ ...prev, password: "Senha deve ter pelo menos 6 caracteres" }));
    } else {
      setErrors((prev) => ({ ...prev, password: "" }));
    }
  };

  const validateConfirmPassword = (confirmPassword: string) => {
    if (!confirmPassword) {
      setErrors((prev) => ({ ...prev, confirmPassword: "Confirme a senha" }));
    } else if (confirmPassword !== formData.password) {
      setErrors((prev) => ({ ...prev, confirmPassword: "As senhas não coincidem" }));
    } else {
      setErrors((prev) => ({ ...prev, confirmPassword: "" }));
    }
  };

  const handleNextStep = () => {
    if (step === 1) {
      validateName(formData.name);
      validateEmail(formData.email);
      validateUserType(formData.userType);

      if (!formData.name || !formData.email || !formData.userType || errors.name || errors.email || errors.userType) {
        return;
      }
      setStep(2);
    }
  };

  const handleSubmit = async () => {
    validateUserCategory(formData.userCategory);
    validateState(formData.state);
    validateCity(formData.city);
    validatePassword(formData.password);
    validateConfirmPassword(formData.confirmPassword);

    if (
      !formData.userCategory ||
      !formData.state ||
      !formData.city ||
      !formData.password ||
      !formData.confirmPassword ||
      errors.userCategory ||
      errors.state ||
      errors.city ||
      errors.password ||
      errors.confirmPassword
    ) {
      return;
    }

    setLoading(true);
    const userData = {
      name: formData.name,
      email: formData.email,
      password: formData.password,
      role: "Common",
      userType: formData.userCategory,
      userCategory: formData.userType,
      state: formData.state,
      city: formData.city,
    };

    try {
      const response = await apiBase.post("/users", userData, {
        headers: { "Content-Type": "application/json" },
      });

      if (response.status === 201) {
        setShowSuccessPopup(true);
      } else {
        setShowErrorPopup(true);
      }
    } catch (error) {
      setShowErrorPopup(true);
    } finally {
      setLoading(false);
    }
  };

  const closePopup = () => {
    if (showSuccessPopup) {
      setShowSuccessPopup(false);
      router.push("/login");
    } else if (showErrorPopup) {
      setShowErrorPopup(false);
      router.push("/");
    }
  };

  return (
    <main className={`flex justify-center items-center min-h-screen p-8 ${isMobile ? "bg-green-background" : ""}`}>
      {/* Popup de Sucesso */}
      {showSuccessPopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg text-center z-50">
            <h2 className="text-xl font-bold text-green-600 mb-4">Cadastro Realizado!</h2>
            <p className="text-gray-700 mb-4">Sua conta foi criada com sucesso. Redirecionando para o login...</p>
            <button
              onClick={closePopup}
              className="bg-green-800 text-white px-4 py-2 rounded-lg hover:bg-green-900"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* Popup de Erro */}
      {showErrorPopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg text-center z-50">
            <h2 className="text-xl font-bold text-red-600 mb-4">Erro ao Cadastrar</h2>
            <p className="text-gray-700 mb-4">Ocorreu um erro ao tentar criar sua conta. Tente novamente mais tarde.</p>
            <button
              onClick={closePopup}
              className="bg-green-800 text-white px-4 py-2 rounded-lg hover:bg-green-900"
            >
              OK
            </button>
          </div>
        </div>
      )}

      <div className="w-full max-w-4xl bg-white shadow-lg rounded-lg overflow-hidden flex flex-col md:flex-row">
        <div className="w-full md:w-1/2 p-8 flex flex-col justify-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            {step === 1 ? "Criar Conta" : "Finalizar Cadastro"}
          </h1>

          {step === 1 ? (
            <div className="space-y-4">
              {/* Campos da primeira etapa */}
              <div>
                <label className="text-gray-700 font-medium">Nome</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    validateName(e.target.value);
                  }}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
              </div>
              <div>
                <label className="text-gray-700 font-medium">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value });
                    validateEmail(e.target.value);
                  }}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
              </div>
              <div>
                <label className="text-gray-700 font-medium">Tipo de Pessoa</label>
                <select
                  value={formData.userType}
                  onChange={(e) => {
                    setFormData({ ...formData, userType: e.target.value });
                    validateUserType(e.target.value);
                  }}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                >
                  <option value="">Selecione</option>
                  <option value="Fisica">Física</option>
                  <option value="Juridica">Jurídica</option>
                </select>
                {errors.userType && <p className="text-red-500 text-sm mt-1">{errors.userType}</p>}
              </div>
              <Button
                text="PRÓXIMO"
                onClick={handleNextStep}
                bgColor="bg-green-800"
                textColor="text-white"
                hoverColor="hover:bg-green-900"
                className="w-full mt-4"
                disabled={loading || !!errors.name || !!errors.email || !!errors.userType}
              />
              <p className="text-center text-gray-700 mt-4 text-sm">
                Já possui uma conta?{" "}
                <a href="/login" className="text-green-700 font-semibold">Faça Login</a>
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Campos da segunda etapa */}
              <div>
                <label className="text-gray-700 font-medium">Categoria</label>
                <select
                  value={formData.userCategory}
                  onChange={(e) => {
                    setFormData({ ...formData, userCategory: e.target.value });
                    validateUserCategory(e.target.value);
                  }}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                >
                  <option value="">Selecione</option>
                  <option value="Pecuarista">Pecuarista</option>
                  <option value="Cooperativa">Cooperativa</option>
                  <option value="Associacao">Associação</option>
                  <option value="Outro">Outro</option>
                </select>
                {errors.userCategory && <p className="text-red-500 text-sm mt-1">{errors.userCategory}</p>}
              </div>
              <div>
                <label className="text-gray-700 font-medium">Estado</label>
                <select
                  value={formData.state}
                  onChange={(e) => {
                    setFormData({ ...formData, state: e.target.value, city: "" });
                    validateState(e.target.value);
                  }}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                >
                  <option value="">Selecione</option>
                  {estados.map((estado) => (
                    <option key={estado.id} value={estado.sigla}>
                      {estado.nome}
                    </option>
                  ))}
                </select>
                {errors.state && <p className="text-red-500 text-sm mt-1">{errors.state}</p>}
              </div>
              <div>
                <label className="text-gray-700 font-medium">Cidade</label>
                <select
                  value={formData.city}
                  onChange={(e) => {
                    setFormData({ ...formData, city: e.target.value });
                    validateCity(e.target.value);
                  }}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                  disabled={!formData.state}
                >
                  <option value="">Selecione</option>
                  {cidades.map((cidade) => (
                    <option key={cidade.id} value={cidade.nome}>
                      {cidade.nome}
                    </option>
                  ))}
                </select>
                {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
              </div>
              <div className="relative">
                <label className="text-gray-700 font-medium">Senha</label>
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => {
                    setFormData({ ...formData, password: e.target.value });
                    validatePassword(e.target.value);
                  }}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 pr-10"
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 text-gray-500 hover:text-gray-700"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
                {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
              </div>
              <div className="relative">
                <label className="text-gray-700 font-medium">Confirmar Senha</label>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) => {
                    setFormData({ ...formData, confirmPassword: e.target.value });
                    validateConfirmPassword(e.target.value);
                  }}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 pr-10"
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 text-gray-500 hover:text-gray-700"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
                {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
              </div>
              <Button
                text={loading ? "Cadastrando..." : "CADASTRAR"}
                onClick={handleSubmit}
                bgColor="bg-green-800"
                textColor="text-white"
                hoverColor="hover:bg-green-900"
                className="w-full mt-4"
                disabled={
                  loading ||
                  !!errors.userCategory ||
                  !!errors.state ||
                  !!errors.city ||
                  !!errors.password ||
                  !!errors.confirmPassword
                }
              />
            </div>
          )}
        </div>
        {/* Seção Direita - Apenas em telas maiores */}
        {!isMobile && (
          <div className="hidden md:flex w-full md:w-1/2 bg-green-background p-16 flex-col justify-between items-center relative">
            <div className="text-center">
              <h1 className="text-2xl text-white mb-4">
                Bem-vindo ao <span className="font-bold">QualeiDer!</span>
              </h1>
              <div className="text-white space-y-2 text-sm">
                <p>Sua ferramenta essencial para o gerenciamento da produção leiteira.</p>
                <p>Com o <strong>QualeiDer</strong>, você pode:</p>
                <ul className="list-disc list-inside">
                  <li><strong>Cadastrar e gerenciar</strong> seus animais de forma simples e organizada.</li>
                  <li><strong>Monitorar a produção diária</strong> de leite com precisão e facilidade.</li>
                  <li><strong>Acessar gráficos detalhados</strong> para tomar decisões mais inteligentes.</li>
                </ul>
              </div>
            </div>
            <div className="absolute bottom-4 right-4">
              <img src={Logo.src} alt="Logo do sistema" className="w-20 h-20" />
            </div>
          </div>
        )}
      </div>
      <Wave />
    </main>
  );
}
