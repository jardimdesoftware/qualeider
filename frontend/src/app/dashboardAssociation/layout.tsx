import { AssociationSidebar } from "@/components/dashboard/association/AssociationSidebar";

export default function AssociationDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="campus-page-shell flex min-h-screen flex-col md:flex-row">
      <AssociationSidebar />
      <div className="h-screen w-full flex-1 overflow-y-auto pt-16 md:pt-0">{children}</div>
    </div>
  );
}
