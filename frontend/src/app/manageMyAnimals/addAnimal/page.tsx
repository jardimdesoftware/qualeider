/**
 * Pagina removida - o cadastro de animais foi migrado para o modal inline em /manageMyAnimals.
 * Este arquivo redireciona qualquer acesso direto a rota.
 */
import { redirect } from "next/navigation";

export default function AddAnimalRedirect() {
  redirect("/manageMyAnimals");
}
