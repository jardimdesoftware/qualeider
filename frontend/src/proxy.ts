import { NextRequest, NextResponse } from "next/server";
import { buildCsp } from "@/lib/csp";

/**
 * Gera um nonce por requisição e aplica a CSP. O Next.js lê o nonce do header
 * Content-Security-Policy da requisição e o injeta nos scripts do framework
 * (por isso as páginas precisam ser renderizadas dinamicamente — ver
 * `dynamic = "force-dynamic"` em app/layout.tsx).
 */
export function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const csp = buildCsp({
    nonce,
    isDev: process.env.NODE_ENV === "development",
    sentryDsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  });

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  matcher: [
    {
      // Só documentos HTML: fora API (proxy para o backend), assets estáticos
      // e arquivos com extensão (inclui /.well-known/security.txt).
      source: "/((?!api|_next/static|_next/image|.*\\..*).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
