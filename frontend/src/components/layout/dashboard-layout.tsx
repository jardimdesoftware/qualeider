import { ReactNode } from "react";
import { Sidebar } from "@/components/layout";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex flex-col md:flex-row bg-[#fdfbf7] h-screen overflow-hidden">
      <Sidebar />
      {/* pt-16 offsets the fixed mobile top bar; md:pt-0 resets for desktop sidebar (≥768px) */}
      <div className="flex-1 overflow-y-auto pt-16 md:pt-0">
        {children}
      </div>
    </div>
  );
}
