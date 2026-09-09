import Link from "next/link";
import { ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary";

interface ActionButtonProps {
  href: string;
  variant?: ButtonVariant;
  title: string;
  subtitle: string;
  icon?: ReactNode;
}

export default function ActionButton({
  href,
  variant = "primary",
  title,
  subtitle,
  icon,
}: ActionButtonProps) {
  const isPrimary = variant === "primary";

  const baseClasses =
    "w-full rounded-lg border px-6 py-4 font-bold shadow-[0_1px_3px_rgba(16,24,16,0.05)] transition-colors duration-200";
  
  const variantClasses = isPrimary
    ? "border-brand-primary bg-brand-primary text-white hover:bg-brand-primary-hover"
    : "border-brand-primary bg-white text-brand-primary hover:bg-brand-accent";

  const subtitleClasses = isPrimary
    ? "text-white/85"
    : "text-gray-600";

  return (
    <Link href={href}>
      <button className={`${baseClasses} ${variantClasses}`}>
        <div className="flex items-center justify-center gap-2">
          {icon && <span>{icon}</span>}
          <span className="block text-xl">{title}</span>
        </div>
        <span className={`block text-sm mt-1 font-normal ${subtitleClasses}`}>
          {subtitle}
        </span>
      </button>
    </Link>
  );
}
