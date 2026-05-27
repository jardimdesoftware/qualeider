"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getUserRoleFromToken } from "@/utils/auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { User, ShieldCheck, Tractor, CheckCircle2 } from "lucide-react";

import { DashboardLayout } from "@/components/layout";
import { PageHeader } from "@/components/dashboard";
import {
  InputField,
  PasswordStrength,
  ErrorModal,
  Button,
} from "@/components/ui";
import { userService } from "@/services/userService";
import { UserRole, UserCategory } from "@/interfaces/user";
import { getFriendlyErrorMessage } from "@/utils/errorMessage";

// ── Schema de validação ──────────────────────────────────────────────────────

const addUserSchema = z
  .object({
    name: z.string().min(3, "Nome deve ter ao menos 3 caracteres"),
    email: z.string().email("E-mail inválido"),
    password: z
      .string()
      .min(8, "Mínimo de 8 caracteres")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
        "A senha deve ter maiúscula, minúscula, número e caractere especial"
      ),
    confirmPassword: z.string(),
    role: z.nativeEnum(UserRole, { message: "Selecione o cargo" }),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "As senhas não conferem",
    path: ["confirmPassword"],
  });

type AddUserFormData = z.infer<typeof addUserSchema>;

// ── Opções de Cargo ──────────────────────────────────────────────────────────

const ROLE_CARDS = [
  {
    value: UserRole.VAQUEIRO,
    label: "Vaqueiro",
    description: "Responsável pelas atividades operacionais da fazenda.",
    icon: Tractor,
    color: "amber",
  },
  {
    value: UserRole.ADMIN,
    label: "Administrador",
    description: "Acesso completo: gerencia equipe, dados e relatórios.",
    icon: ShieldCheck,
    color: "blue",
  },
] as const;

// ── Componente ───────────────────────────────────────────────────────────────

export default function AddUser() {
  const router = useRouter();

  useEffect(() => {
    const role = getUserRoleFromToken();
    if (role && role !== "ADMIN") {
      router.replace("/dashboardUser");
    }
  }, [router]);

  const [modalState, setModalState] = useState({
    isOpen: false,
    type: "success" as "success" | "error",
    message: "",
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<AddUserFormData>({
    resolver: zodResolver(addUserSchema),
    mode: "onBlur",
    defaultValues: { role: UserRole.VAQUEIRO },
  });

  const selectedRole = watch("role");

  const { mutate: createUser, isPending } = useMutation({
    mutationFn: (values: AddUserFormData) =>
      userService.createInternal({
        name: values.name,
        email: values.email,
        password: values.password,
        role: values.role,
        userCategory: UserCategory.Fisica,
        city: "Belo Jardim",
        state: "PE",
      }),
    onSuccess: () => {
      setModalState({
        isOpen: true,
        type: "success",
        message: "Funcionário cadastrado com sucesso!",
      });
    },
    onError: (err: any) => {
      setModalState({
        isOpen: true,
        type: "error",
        message: getFriendlyErrorMessage(err),
      });
    },
  });

  const handleModalClose = () => {
    const wasSuccess = modalState.type === "success";
    setModalState((prev) => ({ ...prev, isOpen: false }));
    if (wasSuccess) {
      router.push("/manageUsers");
    }
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Adicionar Funcionário"
        subtitle="Cadastre um novo membro da equipe"
      />

      <ErrorModal
        isOpen={modalState.isOpen}
        onClose={handleModalClose}
        title={modalState.type === "success" ? "Sucesso!" : "Erro"}
        message={modalState.message}
        type={modalState.type}
      />

      <div className="p-4 md:p-8 max-w-2xl mx-auto">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 md:p-8">
          <form
            onSubmit={handleSubmit((values) => createUser(values))}
            className="space-y-7"
          >
            {/* ── Seção 1: Qual será o cargo? ─────────────────────────── */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-1">
                <ShieldCheck size={16} className="text-brand-primary" />
                O que este funcionário será?
              </h3>
              <p className="text-xs text-gray-500 mb-4">
                Escolha o nível de acesso antes de preencher os dados.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {ROLE_CARDS.map((card) => {
                  const Icon = card.icon;
                  const isSelected = selectedRole === card.value;
                  const isAmber = card.color === "amber";

                  return (
                    <button
                      key={card.value}
                      type="button"
                      disabled={isPending}
                      onClick={() => setValue("role", card.value, { shouldValidate: true })}
                      className={`
                        relative flex flex-col gap-2 rounded-xl border-2 p-4 text-left transition-all duration-150 focus:outline-none
                        ${isSelected
                          ? isAmber
                            ? "border-amber-500 bg-amber-50 shadow-sm"
                            : "border-blue-500 bg-blue-50 shadow-sm"
                          : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                        }
                        disabled:opacity-60 disabled:cursor-not-allowed
                      `}
                    >
                      {/* Check badge */}
                      {isSelected && (
                        <CheckCircle2
                          size={18}
                          className={`absolute top-3 right-3 ${
                            isAmber ? "text-amber-500" : "text-blue-500"
                          }`}
                        />
                      )}

                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                          isSelected
                            ? isAmber
                              ? "bg-amber-100 text-amber-600"
                              : "bg-blue-100 text-blue-600"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        <Icon size={18} />
                      </div>

                      <div>
                        <p
                          className={`font-semibold text-sm ${
                            isSelected
                              ? isAmber
                                ? "text-amber-700"
                                : "text-blue-700"
                              : "text-gray-800"
                          }`}
                        >
                          {card.label}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5 leading-snug">
                          {card.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Hidden input para react-hook-form */}
              <input type="hidden" {...register("role")} />
              {errors.role && (
                <p className="text-red-500 text-xs mt-2">{errors.role.message}</p>
              )}
            </div>

            <hr className="border-gray-100" />

            {/* ── Seção 2: Dados de Acesso ─────────────────────────────── */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-4">
                <User size={16} className="text-brand-primary" />
                Dados de Acesso
              </h3>
              <div className="space-y-4">
                <InputField
                  label="Nome Completo"
                  disabled={isPending}
                  error={errors.name?.message}
                  {...register("name")}
                />
                <InputField
                  label="E-mail"
                  type="email"
                  helperText="O funcionário usará este e-mail para fazer login"
                  disabled={isPending}
                  error={errors.email?.message}
                  {...register("email")}
                />
                <div className="space-y-2">
                  <InputField
                    label="Senha"
                    showPasswordToggle
                    disabled={isPending}
                    error={errors.password?.message}
                    {...register("password")}
                  />
                  <PasswordStrength password={watch("password") ?? ""} />
                </div>
                <InputField
                  label="Confirmar Senha"
                  showPasswordToggle
                  disabled={isPending}
                  error={errors.confirmPassword?.message}
                  {...register("confirmPassword")}
                />
              </div>
            </div>

            {/* ── Ações ─────────────────────────────────────────────────── */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => router.push("/manageUsers")}
                disabled={isPending}
              >
                Cancelar
              </Button>
              <Button type="submit" variant="primary" disabled={isPending}>
                {isPending ? "Cadastrando..." : "Cadastrar Funcionário"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
