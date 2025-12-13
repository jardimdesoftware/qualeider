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

  const baseClasses = "w-full font-bold py-4 px-6 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg";
  
  const variantClasses = isPrimary
    ? "bg-brand-primary hover:bg-brand-primary-hover text-white"
    : "bg-white hover:bg-gray-50 text-brand-primary border-4 border-brand-secondary";

  const subtitleClasses = isPrimary
    ? "text-brand-accent"
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
