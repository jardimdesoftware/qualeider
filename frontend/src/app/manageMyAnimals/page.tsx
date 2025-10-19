"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/siedbar";
import { apiBase } from "@/services/baseApi";
import React from "react";
import axios from "axios";
import EmptyState from "@/components/empty-state";
import { Cat } from "lucide-react";

interface Animal {
  id: number;
  name: string;
  animalType: string;
  breed: string;
  age: number;
  userId: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export default function ManageAnimals() {
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [animalsPerPage, setAnimalsPerPage] = useState(7);
  const router = useRouter();

  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [animalToDelete, setAnimalToDelete] = useState<number | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      router.push("/login");
      return;
    }

    const payload = JSON.parse(atob(token.split(".")[1]));
    if (payload.role !== "Common") {
      router.push("/");
    }
  }, [router]);

  const fetchAnimals = async () => {
    const token = localStorage.getItem("authToken");

    if (!token) {
      setError("Token de autenticação não encontrado.");
      setLoading(false);
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      if (!payload.sub) {
        setError("ID do usuário não encontrado no token.");
        setLoading(false);
        return;
      }

      const response = await apiBase.get<Animal[]>(
        `/animals/user/${payload.sub}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setAnimals(response.data);
      setLoading(false);
    } catch (err) {
      setLoading(false);
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        // Sem animais cadastrados para o usuário
        setAnimals([]);
        setError(null);
        setInfoMessage("Erro ao carregar os animais. Sem animais cadastrados.");
      } else {
        setError("Erro ao carregar os animais.");
      }
      console.error("Erro ao buscar animais:", err);
    }
  };

  useEffect(() => {
    fetchAnimals();
  }, []);

  const filteredAnimals = animals.filter(
    (animal) =>
      animal.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      animal.animalType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      animal.breed.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLastAnimal = currentPage * animalsPerPage;
  const indexOfFirstAnimal = indexOfLastAnimal - animalsPerPage;
  const currentAnimals = filteredAnimals.slice(
    indexOfFirstAnimal,
    indexOfLastAnimal
  );
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 400) {
        setAnimalsPerPage(2);
      } else if (window.innerWidth > 400 && window.innerWidth < 768) {
        setAnimalsPerPage(4);
      } else {
        setAnimalsPerPage(7);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleDeleteAnimal = async () => {
    if (!animalToDelete) return;

    const token = localStorage.getItem("authToken");
    try {
      await apiBase.delete(`/animals/${animalToDelete}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setSuccessMessage("Animal excluído com sucesso!");
      fetchAnimals();

      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err) {
      setErrorMessage("Erro ao excluir o animal. Tente novamente mais tarde.");
      setShowErrorPopup(true);
    } finally {
      setShowDeletePopup(false);
      setAnimalToDelete(null);
    }
  };

  const handleAddAnimal = () => {
    router.push("/manageMyAnimals/addAnimal");
  };

  const handleEditAnimal = (animal: Animal) => {
    router.push(`/manageMyAnimals/editAnimal?id=${animal.id}`);
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-10 h-10 border-4 bg-green-background border-t-transparent rounded-full animate-spin"></div>
      </div>
    );

  return (
    <div className="flex flex-col lg:flex-row">
      <Sidebar />
      <div className="flex-1 p-8">
        {/* Popup de Confirmação de Exclusão */}
        {showDeletePopup && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg text-center">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Confirmar Exclusão
              </h2>
              <p className="text-gray-700 mb-4">
                Tem certeza que deseja excluir este animal?
              </p>
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => setShowDeletePopup(false)}
                  className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeleteAnimal}
                  className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
                >
                  Excluir
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Popup de Erro */}
        {showErrorPopup && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg text-center">
              <h2 className="text-xl font-bold text-red-600 mb-4">Erro</h2>
              <p className="text-gray-700 mb-4">{errorMessage}</p>
              <button
                onClick={() => setShowErrorPopup(false)}
                className="bg-green-800 text-white px-4 py-2 rounded-lg hover:bg-green-900"
              >
                Fechar
              </button>
            </div>
          </div>
        )}

        <div className="flex-col md:flex-row justify-between">
          <h1 className="text-2xl font-bold mb-6 mt-12 md:mt-4">
            Gerenciar Animais
          </h1>
          <div className="mb-4">
            <input
              type="text"
              placeholder="Pesquisar por nome, tipo ou raça"
              className="w-full p-2 border border-gray-300 rounded-lg"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            onClick={handleAddAnimal}
            className="bg-green-background text-white px-4 py-2 rounded-lg mb-6"
          >
            + Adicionar Animal
          </button>
        </div>

        {/* Exibe mensagem de sucesso acima da tabela */}
        {successMessage && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
            {successMessage}
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-red-700">
            {error}
          </div>
        )}

        {!error && infoMessage && animals.length === 0 && (
          <div className="mb-6">
            <div className="mb-4 rounded-md border border-gray-200 bg-gray-50 px-4 py-3 text-gray-700">
              {infoMessage}
            </div>
            <EmptyState
              icon={<Cat size={40} />}
              title={infoMessage}
              description="Cadastre seu primeiro animal para começar."
              actionHref="/manageMyAnimals/addAnimal"
              actionLabel="Cadastrar animal"
            />
          </div>
        )}

        {!error && animals.length > 0 && (
          <>
            <div className="overflow-x-auto mb-6">
              <table className="min-w-full bg-white border border-gray-300 rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-green-background text-white">
                    <th className="p-3 text-left">Nome</th>
                    <th className="p-3 text-left hidden md:table-cell">Tipo</th>
                    <th className="p-3 text-left hidden md:table-cell">Raça</th>
                    <th className="p-3 text-left hidden md:table-cell">
                      Idade
                    </th>
                    <th className="p-3 text-left">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {currentAnimals.map((animal) => (
                    <tr
                      key={animal.id}
                      className="border-b border-gray-200 hover:bg-gray-50"
                    >
                      <td className="p-3">
                        <div className="flex flex-col">
                          <span className="font-semibold">{animal.name}</span>
                          <span className="text-sm text-gray-600 md:hidden">
                            {animal.animalType}
                          </span>
                          <span className="text-sm text-gray-600 md:hidden">
                            Raça: {animal.breed}
                          </span>
                          <span className="text-sm text-gray-600 md:hidden">
                            Idade: {animal.age}
                          </span>
                        </div>
                      </td>
                      <td className="p-3 hidden md:table-cell">
                        {animal.animalType}
                      </td>
                      <td className="p-3 hidden md:table-cell">
                        {animal.breed}
                      </td>
                      <td className="p-3 hidden md:table-cell">{animal.age}</td>
                      <td className="p-3">
                        <button
                          onClick={() => handleEditAnimal(animal)}
                          className="text-green-500 hover:text-green-800 mr-2"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => {
                            setAnimalToDelete(animal.id);
                            setShowDeletePopup(true);
                          }}
                          className="text-red-500 hover:text-red-800"
                        >
                          Excluir
                        </button>
                      </td>
                    </tr>
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
                {Math.ceil(filteredAnimals.length / animalsPerPage)}
              </span>
              <button
                onClick={() => paginate(currentPage + 1)}
                disabled={
                  currentPage * animalsPerPage >= filteredAnimals.length
                }
                className="px-4 py-2 bg-blue-500 text-white rounded-r disabled:opacity-50"
              >
                Próximo
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
