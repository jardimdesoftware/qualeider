"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getUserRoleFromToken } from "@/utils/auth";

export type AppRole = "ADMIN" | "VAQUEIRO";

/**
 * Protege uma pagina dentro de dashboardUser para que apenas usuarios com um
 * dos `allowedRoles` consigam visualiza-la. Caso o usuario logado tenha um
 * role nao permitido (ex: VAQUEIRO tentando acessar uma pagina ADMIN-only),
 * ele e redirecionado para `redirectTo` (padrao: /dashboardUser).
 *
 * Uso:
 * ```ts
 * const { isChecking } = useRoleGuard(["ADMIN"]);
 * if (isChecking) return null; // evita "flash" de conteudo restrito
 * ```
 */
export function useRoleGuard(allowedRoles: AppRole[], redirectTo = "/dashboardUser") {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  // Serializa para evitar re-execucoes do efeito quando o array e recriado
  // a cada render (ex: useRoleGuard(["ADMIN"]) inline no componente).
  const allowedRolesKey = allowedRoles.join(",");

  useEffect(() => {
    const role = getUserRoleFromToken();

    if (role && !allowedRolesKey.split(",").includes(role)) {
      router.replace(redirectTo);
      return;
    }

    setIsChecking(false);
  }, [allowedRolesKey, redirectTo, router]);

  return { isChecking };
}
