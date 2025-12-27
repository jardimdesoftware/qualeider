import Image from "next/image";
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Menu,
  X,
  Users,
  FileText,
  PieChart,
  LogOut,
  Milk,
  Settings,
  Bell,
} from "lucide-react";
import { getUserTypeFromToken, clearAuthToken } from "@/utils/auth";
import { debounce } from "@/utils/debounce";

export default function Sidebar() {
  const [isMobile, setIsMobile] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userRole, setUserRole] = useState<"association" | "user">("user");
  const [pathname, setPathname] = useState("");

  const debouncedCheckScreenSize = useMemo(
    () =>
      debounce(() => {
        setIsMobile(window.innerWidth < 768);
      }, 150),
    []
  );

  useEffect(() => {
    setPathname(window.location.pathname);

    const role = getUserTypeFromToken();
    setUserRole(role);

    debouncedCheckScreenSize();
    window.addEventListener("resize", debouncedCheckScreenSize);

    return () => window.removeEventListener("resize", debouncedCheckScreenSize);
  }, [debouncedCheckScreenSize]);

  const toggleMenu = () => setMenuOpen(!menuOpen);

  const handleLogout = () => {
    clearAuthToken();
    window.location.href = "/";
  };

  const menuItems =
    userRole === "association"
      ? [
          {
            name: "Dashboard",
            link: "/dashboardAssociation",
            icon: <PieChart size={20} />,
          },
          { name: "Usuários", link: "/manageUsers", icon: <Users size={20} /> },
          { name: "Animais", link: "/manageAnimals", icon: <Milk size={20} /> },
          {
            name: "Notificações",
            link: "/dashboardAssociation/notifications",
            icon: <Bell size={20} />,
          },
          {
            name: "Configuração",
            link: "/settings",
            icon: <Settings size={20} />,
          },
        ]
      : [
          {
            name: "Dashboard",
            link: "/dashboardUser",
            icon: <PieChart size={20} />,
          },
          {
            name: "Animais",
            link: "/manageMyAnimals",
            icon: <Milk size={20} />,
          },
          {
            name: "Formulário",
            link: "/dailyForm",
            icon: <FileText size={20} />,
          },
          {
            name: "Histórico",
            link: "/dashboardUser/history",
            icon: <FileText size={20} />,
          },
          {
            name: "Notificações",
            link: "/dashboardUser/notifications",
            icon: <Bell size={20} />,
          },
          {
            name: "Configuração",
            link: "/settings",
            icon: <Settings size={20} />,
          },
        ];

  return (
    <div>
      {isMobile ? (
        <div className="relative">
          {/* Barra verde no topo */}
          <div className="fixed top-0 left-0 right-0 bg-green-background p-4 flex justify-between items-center z-40 shadow-md">
            <button onClick={toggleMenu} className="text-white">
              {menuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <h2 className="text-white font-bold text-lg">QualeiDer</h2>
          </div>

          {/* Menu lateral acima da barra verde */}
          <div
            className={`fixed top-0 left-0 h-screen w-64 bg-green-background shadow-lg p-4 transition-transform duration-300 z-50 ${
              menuOpen ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            <button
              onClick={toggleMenu}
              className="absolute top-4 right-4 text-white"
            >
              <X size={24} />
            </button>

            {/* Logo */}
            <div className="flex items-center gap-2 p-4">
              <Image
                src="/logo_icon.svg"
                alt="Logo"
                className="w-10 h-10"
                width={40}
                height={40}
              />
              <h2 className="text-white font-bold text-lg">QualeiDer</h2>
            </div>

            <nav className="mt-6 space-y-4">
              {menuItems.map((item) => (
                <Link
                  key={item.link}
                  href={item.link}
                  className={`flex items-center gap-2 p-3 rounded-lg transition-colors duration-200 ${
                    pathname === item.link
                      ? "text-gray-900 bg-white"
                      : "text-white hover:bg-gray-200 hover:text-gray-900"
                  }`}
                >
                  {item.icon}
                  {item.name}
                </Link>
              ))}
            </nav>

            {/* Botão de sair */}
            <div className="absolute bottom-4 left-4">
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-white p-3 rounded-lg hover:bg-red-600"
              >
                <LogOut size={20} />
                Sair
              </button>
            </div>
          </div>
        </div>
      ) : (
        <aside className="h-screen w-64 bg-green-background shadow-lg p-4 flex flex-col justify-between">
          <div>
            {/* Logo */}
            <div className="flex items-center gap-2 p-4">
              <Image
                src="/logo_icon.svg"
                alt="Logo"
                className="w-10 h-10"
                width={40}
                height={40}
              />
              <h2 className="text-white font-bold text-lg">QualeiDer</h2>
            </div>

            <nav className="mt-6 space-y-4">
              {menuItems.map((item) => (
                <Link
                  key={item.link}
                  href={item.link}
                  className={`flex items-center gap-2 p-3 rounded-lg transition-colors duration-200 ${
                    pathname === item.link
                      ? "text-gray-900 bg-white"
                      : "text-white hover:bg-gray-200 hover:text-gray-900"
                  }`}
                >
                  {item.icon}
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>

          {/* Botão de sair */}
          <div className="p-4">
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-white p-3 rounded-lg hover:bg-red-600 hover:text-white w-full transition-colors duration-200"
            >
              <LogOut size={20} />
              Sair
            </button>
          </div>
        </aside>
      )}
    </div>
  );
}
