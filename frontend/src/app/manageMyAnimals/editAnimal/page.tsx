/**
 * Pagina removida - a edicao de animais foi migrada para o modal inline em /manageMyAnimals.
 * Este arquivo redireciona qualquer acesso direto a rota.
 */
import { redirect } from "next/navigation";

export default function EditAnimalRedirect() {
  redirect("/manageMyAnimals");
}
