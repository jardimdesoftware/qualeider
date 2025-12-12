import { AssociationSidebar } from "@/components/dashboard/association/AssociationSidebar";

export default function AssociationDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col md:flex-row bg-[#fdfbf7] min-h-screen">
      <AssociationSidebar />
      <div className="flex-1 h-screen overflow-y-auto w-full">
        {children}
      </div>
    </div>
  );
}
