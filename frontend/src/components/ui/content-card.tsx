import { ReactNode } from "react";

interface ContentCardProps {
  children: ReactNode;
  className?: string;
}

export default function ContentCard({
  children,
  className = "",
}: ContentCardProps) {
  return (
    <div
      className={`w-full max-w-md overflow-hidden rounded-lg border border-brand-border bg-white shadow-[0_1px_3px_rgba(16,24,16,0.06)] ${className}`}
    >
      {children}
    </div>
  );
}
