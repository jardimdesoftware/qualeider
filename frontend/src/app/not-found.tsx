import Link from "next/link";
import { Home } from "lucide-react"; 
import { ICON_SIZES } from "@/constants/ui";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      {/* Ícone e Mensagem */}
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-800">404</h1>
        <p className="mt-4 text-2xl text-gray-600">Oops! Página não encontrada.</p>
        <p className="mt-2 text-gray-500">
          A página que você está procurando não existe ou foi movida.
        </p>
      </div>

      <Link
        href="/"
        className="mt-8 flex items-center justify-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
      >
        <Home className="mr-2" size={ICON_SIZES.LG} /> 
        Voltar para a Home
      </Link>
    </div>
  );
}