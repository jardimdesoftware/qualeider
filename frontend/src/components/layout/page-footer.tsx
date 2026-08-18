import AppVersionBadge from "@/components/global/AppVersionBadge";

interface PageFooterProps {
  text?: string;
}

export default function PageFooter({
  text = "© 2025 IFPE - Campus Belo Jardim",
}: PageFooterProps) {
  return (
    <div className="bg-gray-50 py-4 px-8 border-t border-gray-200">
      <p className="text-center text-gray-500 text-xs">
        {text} · <AppVersionBadge className="text-gray-400" />
      </p>
    </div>
  );
}
