"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { inviteService } from "@/services/inviteService";
import { toast } from "react-hot-toast";
import { Loader2 } from "lucide-react";
import { TIMING, STROKE_WIDTH } from "@/constants/ui";

export default function InvitePage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"processing" | "success" | "error">("processing");
  const [message, setMessage] = useState("Processando seu convite...");

  useEffect(() => {
    const processInvite = async () => {
      await new Promise((resolve) => setTimeout(resolve, TIMING.DEBOUNCE_SHORT));

      const token = params?.token as string;
      const action = searchParams?.get("action");
      if (!token) {
        setStatus("error");
        setMessage("Token de convite inválido ou ausente.");
        return; 
      }

      if (!action || (action !== "accept" && action !== "decline")) {
        setStatus("error");
        setMessage("Ação inválida. Use o link enviado por e-mail.");
        return;
      }

      try {
        const inviteAction = action === "accept" ? "Accept" : "Decline";
        await inviteService.respondToInvite(token, inviteAction);

        setStatus("success");
        const successMsg =
          inviteAction === "Accept"
            ? "Convite aceito com sucesso! Redirecionando..."
            : "Convite recusado. Redirecionando...";
        setMessage(successMsg);
        toast.success(successMsg);

        setTimeout(() => {
          router.push("/dashboardUser?tab=memberships");
        }, TIMING.DEBOUNCE_SHORT);
      } catch (error: any) {
        console.error("Invite error:", error);
        setStatus("error");
        
        const errorMsg = error.response?.data?.message || "Erro ao processar convite. Tente novamente ou contate o suporte.";
        setMessage(errorMsg);
        toast.error(errorMsg);
      }
    };

    processInvite();
  }, [params, searchParams, router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-8 text-center shadow-lg">
        {status === "processing" && (
          <>
            <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-green-600" />
            <h1 className="mb-2 text-xl font-bold text-gray-800">Processando convite...</h1>
            <p className="text-gray-600">Por favor, aguarde um momento.</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <svg
                className="h-8 w-8 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={STROKE_WIDTH.NORMAL}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h1 className="mb-2 text-xl font-bold text-green-700">Tudo certo!</h1>
            <p className="text-gray-600">{message}</p>
          </>
        )}

        {status === "error" && (
          <>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <svg
                className="h-8 w-8 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={STROKE_WIDTH.NORMAL}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h1 className="mb-2 text-xl font-bold text-red-700">Ops! Algo deu errado.</h1>
            <p className="text-gray-600">{message}</p>
            <button
              onClick={() => router.push("/")}
              className="mt-6 rounded-lg bg-gray-800 px-6 py-2 text-white hover:bg-gray-700 transition"
            >
              Voltar para o Início
            </button>
          </>
        )}
      </div>
    </div>
  );
}
