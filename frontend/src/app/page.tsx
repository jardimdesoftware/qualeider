import { redirect } from "next/navigation";

/**
 * Raiz da aplicação.
 * Redireciona diretamente para o login — a landing page foi removida
 * do fluxo principal para simplificar a navegação.
 */
export default function RootPage() {
  redirect("/login");
}
