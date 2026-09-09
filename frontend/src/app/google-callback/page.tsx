"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { setAuthToken } from "@/utils/auth";

/**
 * Destino do redirect feito por GET /api/auth/google/callback (backend) após
 * um login com Google bem-sucedido: recebe o JWT via query string, salva do
 * mesmo jeito que o login por senha e manda para o dashboard. Erros (email
 * sem acesso, etc.) o backend já redireciona direto para /login?error=.
 */
function GoogleCallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get("token");
    if (token) {
      setAuthToken(token);
      router.replace("/dashboardUser");
    } else {
      router.replace("/login");
    }
  }, [router, searchParams]);

  return null;
}

export default function GoogleCallbackPage() {
  return (
    <main className="campus-page-shell flex min-h-screen items-center justify-center px-4">
      <p className="text-sm font-medium text-gray-500">Entrando...</p>
      <Suspense fallback={null}>
        <GoogleCallbackHandler />
      </Suspense>
    </main>
  );
}
