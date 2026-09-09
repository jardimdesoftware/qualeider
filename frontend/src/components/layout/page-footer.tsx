import AppVersionBadge from "@/components/global/AppVersionBadge";

interface PageFooterProps {
  text?: string;
}

export default function PageFooter({
  text = "(c) 2025 IFPE - Campus Belo Jardim",
}: PageFooterProps) {
  return (
    <div className="border-t border-brand-border bg-gray-50 px-6 py-4">
      <p className="text-center text-xs text-brand-muted">
        {text} - <AppVersionBadge className="text-gray-400" />
      </p>
    </div>
  );
}
