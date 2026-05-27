"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Redireciona diretamente para o cadastro do administrador da fazenda.
 * A escolha entre Produtor/Associação foi removida — apenas um perfil público de registro existe.
 */
export default function CreateAccount() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/createProducer");
  }, [router]);

  return null;
}
