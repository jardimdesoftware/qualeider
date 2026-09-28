import { ReactNode } from "react";
import { Sidebar } from "@/components/layout";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="bg-[#fdfbf7] flex h-screen flex-col overflow-hidden md:flex-row">
      <Sidebar />
      <div className="flex-1 min-h-0 flex flex-col overflow-y-auto pt-16 md:pt-0">
        {children}
      </div>
    </div>
  );
}
