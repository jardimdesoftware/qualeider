import { ReactNode } from "react";
import Image from "next/image";
import AppVersionBadge from "@/components/global/AppVersionBadge";

/**
 * Grade de quadrados que ecoa o vocabulário gráfico do manual de marca do
 * Instituto Federal (mosaico de quadrados, um deles em vermelho como
 * ênfase pontual) — não é uma reprodução da marca registrada do IF, é uma
 * textura própria do QualeiDer inspirada nesse vocabulário. Ver DESIGN.md.
 */
function BrandMosaic({
  className = "",
  showAccent = true,
}: {
  className?: string;
  showAccent?: boolean;
}) {
  const cols = 6;
  const rows = 6;
  const cell = 16;
  const gap = 6;
  const step = cell + gap;
  const redCell = { col: 1, row: 2 };

  const squares = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const isRed = showAccent && col === redCell.col && row === redCell.row;
      squares.push(
        <rect
          key={`${col}-${row}`}
          x={col * step}
          y={row * step}
          width={cell}
          height={cell}
          rx={3}
          fill={isRed ? "#cd191e" : "#ffffff"}
          fillOpacity={isRed ? 0.9 : 0.14}
        />,
      );
    }
  }

  return (
    <svg
      className={className}
      viewBox={`0 0 ${cols * step - gap} ${rows * step - gap}`}
      aria-hidden="true"
    >
      {squares}
    </svg>
  );
}

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  /** Largura do painel de conteúdo — telas com formulário maior (ex: cadastro em etapas) usam "lg". */
  contentWidth?: "sm" | "lg";
}

const CONTENT_WIDTH = {
  sm: "max-w-sm",
  lg: "max-w-2xl",
};

/**
 * Casco compartilhado das telas de autenticação (login, criar conta,
 * esqueci/redefinir senha): painel de identidade institucional verde à
 * esquerda (colapsa para uma faixa compacta no topo em telas estreitas) +
 * painel de conteúdo branco à direita. Ver DESIGN.md.
 */
export default function AuthLayout({
  title,
  subtitle,
  children,
  contentWidth = "sm",
}: AuthLayoutProps) {
  return (
    <main className="min-h-screen flex flex-col md:flex-row">
      {/* Painel de identidade institucional */}
      <div className="relative bg-brand-primary overflow-hidden md:w-[42%] md:min-h-screen shrink-0">
        <BrandMosaic className="absolute -right-10 -top-10 w-56 h-56 md:w-72 md:h-72" />
        <BrandMosaic
          className="absolute -left-16 -bottom-16 w-64 h-64 hidden md:block"
          showAccent={false}
        />

        <div className="relative px-6 py-10 md:px-12 md:py-16 md:min-h-screen md:flex md:flex-col md:justify-between">
          <div className="flex items-center gap-4 md:block">
            <Image
              src="/logo_icon.svg"
              alt=""
              width={64}
              height={64}
              className="w-14 h-14 md:w-20 md:h-20 md:mb-6"
              priority
            />
            <div>
              <h1 className="text-white text-2xl md:text-4xl font-bold leading-tight">
                QualeiDer
              </h1>
              <p className="text-white/80 text-sm md:text-base md:mt-2 max-w-xs">
                Controle da produção leiteira do rebanho
              </p>
            </div>
          </div>

          <p className="hidden md:block text-white/60 text-xs tracking-wide uppercase mt-12">
            Instituto Federal de Pernambuco
            <br />
            Campus Belo Jardim
          </p>
        </div>
      </div>

      {/* Painel de conteúdo */}
      <div className="flex-1 flex items-center justify-center px-6 py-10 md:px-12 bg-white">
        <div className={`w-full ${CONTENT_WIDTH[contentWidth]}`}>
          <h2 className="text-slate-800 text-2xl font-bold mb-1">{title}</h2>
          <p className="text-gray-500 text-sm mb-8">{subtitle}</p>

          {children}

          <p className="text-center text-gray-400 text-xs mt-10">
            © 2025 IFPE - Campus Belo Jardim ·{" "}
            <AppVersionBadge className="text-gray-400" />
          </p>
        </div>
      </div>
    </main>
  );
}
