"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/sidebar";
import { apiBase } from "@/services/baseApi";
import React from "react";
import { User } from "@/interfaces/user";

export default function ManageUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [expandedUserId, setExpandedUserId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage, setUsersPerPage] = useState(7);
  const router = useRouter();

  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [userToDelete, setUserToDelete] = useState<number | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      if (payload.role !== "Admin") {
        router.push("/");
      } else {
        fetchUsers(payload.associationId); 
      }
    } catch {
      router.push("/login");
    }
  }, [router]);

  const fetchUsers = async (associationId?: number) => {
    const token = localStorage.getItem("authToken");
    try {
      const queryParams = associationId ? `?associationId=${associationId}` : '';
      
      const response = await apiBase.get<User[]>(`/users${queryParams}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setUsers(response.data);
      setLoading(false);
    } catch {
      setLoading(false);
      setError("Erro ao carregar os usuários.");
    }
  };

  const toggleUserDetails = (userId: number) => {
    setExpandedUserId(expandedUserId === userId ? null : userId);
  };

  const filteredUsers = users.filter((user) =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 400) {
        setUsersPerPage(2);
      } else if (window.innerWidth > 400 && window.innerWidth < 768) {
        setUsersPerPage(5);
      } else {
        setUsersPerPage(7);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    const token = localStorage.getItem("authToken");
    try {
      await apiBase.delete(`/users/${userToDelete}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setSuccessMessage("Usuário excluído com sucesso!");
      fetchUsers();

      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err) {
      console.error("Erro ao excluir o usuário:", err);
      setError("Erro ao excluir o usuário. Tente novamente mais tarde.");
    } finally {
      setShowDeletePopup(false);
      setUserToDelete(null);
    }
  };

  const handleAddUser = () => {
    router.push("/manageUsers/addUser");
  };

  const handleEditUser = (user: User) => {
    router.push(`/manageUsers/editUser?id=${user.id}`);
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-10 h-10 border-4 bg-green-background border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  if (error) return <div>Erro: {error}</div>;

  return (
    <div className="flex flex-col lg:flex-row">
      <Sidebar />
      <div className="flex-1 p-8">
        {/* Popout de Confirmação de Exclusão */}
        {showDeletePopup && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg text-center">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Confirmar Exclusão
              </h2>
              <p className="text-gray-700 mb-4">
                Tem certeza que deseja excluir este usuário?
              </p>
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => setShowDeletePopup(false)}
                  className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeleteUser}
                  className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
                >
                  Excluir
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex-col md:flex-row justify-between">
          <h1 className="text-2xl font-bold mb-6 mt-12 md:mt-4">
            Gerenciar Usuários
          </h1>
          <div className="mb-4">
            <input
              type="text"
              placeholder="Pesquisar usuário"
              className="w-full p-2 border border-gray-300 rounded-lg"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            onClick={handleAddUser}
            className="bg-green-background text-white px-4 py-2 rounded-lg mb-6"
          >
            + Adicionar Usuário
          </button>
        </div>

        {/* Exibe mensagem de sucesso */}
        {successMessage && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
            {successMessage}
          </div>
        )}

        {/* Exibe mensagem de erro */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        <div className="overflow-x-auto mb-6">
          <table className="min-w-full bg-white border border-gray-300 rounded-lg overflow-hidden">
            <thead>
              <tr className="bg-green-background text-white">
                <th className="p-3 text-left">Nome</th>
                <th className="p-3 text-left hidden md:table-cell">Email</th>
                <th className="p-3 text-left hidden md:table-cell">
                  Categoria
                </th>
                <th className="p-3 text-left">Ações</th>
              </tr>
            </thead>
            <tbody>
              {currentUsers.map((user) => (
                <React.Fragment key={user.id}>
                  <tr className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="p-3">
                      <div className="flex flex-col">
                        <span className="font-semibold">{user.name}</span>
                        <span className="text-sm text-gray-600 md:hidden">
                          {user.email}
                        </span>
                        <span className="text-sm text-gray-600 md:hidden">
                          {user.userType || "Admin"}
                        </span>
                      </div>
                    </td>
                    <td className="p-3 hidden md:table-cell">{user.email}</td>
                    <td className="p-3 hidden md:table-cell">
                      {user.userType || "Admin"}
                    </td>
                    <td className="p-3">
                      <button
                        onClick={() => toggleUserDetails(user.id)}
                        className="text-blue-500 hover:text-blue-800 mr-2"
                      >
                        {expandedUserId === user.id ? "Fechar" : "Visualizar"}
                      </button>
                      <button
                        onClick={() => handleEditUser(user)}
                        className="text-green-500 hover:text-green-800 mr-2"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => {
                          setUserToDelete(user.id);
                          setShowDeletePopup(true);
                        }}
                        className="text-red-500 hover:text-red-800"
                      >
                        Excluir
                      </button>
                    </td>
                  </tr>
                  {expandedUserId === user.id && (
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <td colSpan={4} className="p-3">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="font-semibold">Acesso:</span>{" "}
                            {user.role}
                          </div>
                          <div>
                            <span className="font-semibold">Pessoa:</span>{" "}
                            {user.userCategory}
                          </div>
                          <div>
                            <span className="font-semibold">Cidade:</span>{" "}
                            {user.city}
                          </div>
                          <div>
                            <span className="font-semibold">Estado:</span>{" "}
                            {user.state}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        <div className="flex justify-center mt-6">
          <button
            onClick={() => paginate(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-blue-500 text-white rounded-l disabled:opacity-50"
          >
            Anterior
          </button>
          <span className="px-4 py-2 text-gray-600">
            Pág. {currentPage} de{" "}
            {Math.ceil(filteredUsers.length / usersPerPage)}
          </span>
          <button
            onClick={() => paginate(currentPage + 1)}
            disabled={currentPage * usersPerPage >= filteredUsers.length}
            className="px-4 py-2 bg-blue-500 text-white rounded-r disabled:opacity-50"
          >
            Próximo
          </button>
        </div>
      </div>
    </div>
  );
}
