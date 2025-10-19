import Link from "next/link";
import { ReactNode } from "react";

type EmptyStateProps = {
  icon?: ReactNode;
  title: string;
  description?: string;
  actionHref?: string;
  actionLabel?: string;
};

export default function EmptyState({
  icon,
  title,
  description,
  actionHref,
  actionLabel,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center">
      {icon && <div className="mb-3 text-gray-400">{icon}</div>}
      <h3 className="text-lg font-semibold">{title}</h3>
      {description && (
        <p className="mt-1 text-sm text-gray-500">{description}</p>
      )}
      {actionHref && actionLabel && (
        <Link
          href={actionHref}
          className="mt-4 rounded-md bg-green-600 px-4 py-2 text-white hover:bg-green-700"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
