import { ReactNode } from "react";
import { Sidebar } from "@/components/layout";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="campus-page-shell flex h-screen flex-col overflow-hidden md:flex-row">
      <Sidebar />
      <div className="flex-1 overflow-y-auto pt-16 md:pt-0">{children}</div>
    </div>
  );
}
