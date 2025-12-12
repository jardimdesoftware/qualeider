import Image from "next/image";
import { useState, useEffect } from "react";
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
} from "lucide-react";

export default function Sidebar() {
  const [isMobile, setIsMobile] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userRole, setUserRole] = useState<"association" | "user">("user");
  const [pathname, setPathname] = useState("");

  useEffect(() => {
    setPathname(window.location.pathname);
  }, []);

  const getUserRoleFromToken = () => {
    const token = localStorage.getItem("authToken");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        return payload.userType || "user";
      } catch (error) {
        console.error("Erro ao decodificar o token:", error);
      }
    }
    return "user";
  };

  useEffect(() => {
    const role = getUserRoleFromToken();
    setUserRole(role);
  }, []);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  const toggleMenu = () => setMenuOpen(!menuOpen);

  const handleLogout = () => {
    localStorage.removeItem("authToken");
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
