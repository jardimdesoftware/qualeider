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
      className={`w-full max-w-md bg-white shadow-2xl rounded-2xl overflow-hidden ${className}`}
    >
      {children}
    </div>
  );
}
