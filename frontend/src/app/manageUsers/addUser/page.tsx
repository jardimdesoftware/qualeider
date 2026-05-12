"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { User, ShieldCheck } from "lucide-react";

import { DashboardLayout } from "@/components/layout";
import { PageHeader } from "@/components/dashboard";
import {
  InputField,
  SelectField,
  PasswordStrength,
  ErrorModal,
  Button,
} from "@/components/ui";
import { userService } from "@/services/userService";
import { UserRole, UserCategory } from "@/interfaces/user";
import { useStates, useCities } from "@/hooks/queries/useLocation";
import { getFriendlyErrorMessage } from "@/utils/errorMessage";
import { maskCPF } from "@/utils/masks";

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
    role: z.nativeEnum(UserRole, { required_error: "Selecione o cargo" }),
    state: z.string().min(1, "Estado é obrigatório"),
    city: z.string().min(1, "Cidade é obrigatória"),
    document: z.string().optional(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "As senhas não conferem",
    path: ["confirmPassword"],
  });

type AddUserFormData = z.infer<typeof addUserSchema>;

// ── Opções de Cargo ──────────────────────────────────────────────────────────

const ROLE_OPTIONS = [
  { value: UserRole.VAQUEIRO, label: "Vaqueiro (Funcionário operacional)" },
  { value: UserRole.ADMIN, label: "Admin (Gestor / Co-administrador)" },
];

// ── Componente ───────────────────────────────────────────────────────────────

export default function AddUser() {
  const router = useRouter();
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

  const selectedState = watch("state");
  const { data: estados = [] } = useStates();
  const { data: cidades = [], isLoading: isLoadingCities } =
    useCities(selectedState);

  const estadoOptions = estados.map((e) => ({ value: e.sigla, label: e.nome }));
  const cidadeOptions = cidades.map((c) => ({ value: c.nome, label: c.nome }));

  const { mutate: createUser, isPending } = useMutation({
    mutationFn: (values: AddUserFormData) =>
      userService.createInternal({
        name: values.name,
        email: values.email,
        password: values.password,
        role: values.role,
        userCategory: UserCategory.Fisica,
        city: values.city,
        state: values.state,
        document: values.document || undefined,
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
    setModalState((prev) => ({ ...prev, isOpen: false }));
    if (modalState.type === "success") {
      router.push("/manageUsers");
    }
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Adicionar Funcionário"
        subtitle="Cadastre um novo membro da equipe da fazenda"
      />

      <ErrorModal
        isOpen={modalState.isOpen}
        onClose={handleModalClose}
        title={modalState.type === "success" ? "Sucesso!" : "Erro"}
        message={modalState.message}
        type={modalState.type}
      />

      <div className="p-6 md:p-8 max-w-2xl mx-auto">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 md:p-8">
          <form
            onSubmit={handleSubmit((values) => createUser(values))}
            className="space-y-6"
          >
            {/* Seção: Dados de Acesso */}
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

            <hr className="border-gray-100" />

            {/* Seção: Cargo */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-4">
                <ShieldCheck size={16} className="text-brand-primary" />
                Cargo / Perfil
              </h3>
              <div className="space-y-4">
                <SelectField
                  label="Cargo na Fazenda"
                  disabled={isPending}
                  error={errors.role?.message}
                  helperText="Define o nível de acesso do funcionário no sistema"
                  {...register("role")}
                  options={ROLE_OPTIONS}
                />
              </div>
            </div>

            <hr className="border-gray-100" />

            {/* Seção: Localização */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-4">
                Localização
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <SelectField
                    label="Estado"
                    disabled={isPending}
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
                    disabled={isPending || !selectedState || isLoadingCities}
                    error={errors.city?.message}
                    {...register("city")}
                    options={cidadeOptions}
                  />
                </div>
                <InputField
                  label="CPF (opcional)"
                  disabled={isPending}
                  error={errors.document?.message}
                  helperText="Apenas para identificação interna"
                  {...register("document")}
                  onChange={(e) =>
                    setValue("document", maskCPF(e.target.value))
                  }
                />
              </div>
            </div>

            {/* Ações */}
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
