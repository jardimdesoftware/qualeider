"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout";
import { Button, EmptyState, ErrorModal, InputField } from "@/components/ui";
import { Cat, Plus, Edit, Trash2 } from "lucide-react";
import { Animal } from "@/interfaces/animal";
import DashboardLoading from "@/components/dashboard/DashboardLoading";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { animalService } from "@/services/animalService";

export default function ManageAnimals() {
  const router = useRouter();
  const { userId, isLoading: authLoading } = useAuthGuard("user");
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [animalsPerPage, setAnimalsPerPage] = useState(7);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [animalToDelete, setAnimalToDelete] = useState<number | null>(null);

  useEffect(() => {
    if (!userId) return;
    fetchAnimals();
  }, [userId]);

  const fetchAnimals = async () => {
    try {
      const data = await animalService.getByUser(userId!);
      setAnimals(data);
      setLoading(false);
    } catch (err) {
      setLoading(false);
      setAnimals([]);
      console.error("Erro ao buscar animais:", err);
    }
  };

  useEffect(() => {
    fetchAnimals();
  }, []);

  const filteredAnimals = animals.filter(
    (animal) =>
      (animal.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      animal.animalType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      animal.breed.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLastAnimal = currentPage * animalsPerPage;
  const indexOfFirstAnimal = indexOfLastAnimal - animalsPerPage;
  const currentAnimals = filteredAnimals.slice(
    indexOfFirstAnimal,
    indexOfLastAnimal
  );
  const totalPages = Math.ceil(filteredAnimals.length / animalsPerPage);

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

  const confirmDelete = (animalId: number) => {
    setAnimalToDelete(animalId);
    setShowDeleteModal(true);
  };

  const handleDeleteAnimal = async () => {
    if (!animalToDelete) return;

    try {
      await animalService.delete(animalToDelete);
      setModalMessage("Animal excluído com sucesso!");
      setShowSuccessModal(true);
      fetchAnimals();
    } catch (err) {
      console.error("Erro ao excluir o animal:", err);
      setModalMessage("Erro ao excluir o animal. Tente novamente.");
      setShowErrorModal(true);
    } finally {
      setShowDeleteModal(false);
      setAnimalToDelete(null);
    }
  };

  const handleAddAnimal = () => {
    router.push("/manageMyAnimals/addAnimal");
  };

  const handleEditAnimal = (animal: Animal) => {
    router.push(`/manageMyAnimals/editAnimal?id=${animal.id}`);
  };

  if (authLoading || loading) {
    return <DashboardLoading />;
  }

  return (
    <div className="flex flex-col lg:flex-row bg-[#fdfbf7] min-h-screen">
      <Sidebar />
      <div className="flex-1 overflow-y-auto">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-slate-200 px-6 md:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl md:text-3xl font-black text-[#1e3a29]">
                Meus Animais
              </h2>
              <p className="text-slate-500">Gerencie seu rebanho</p>
            </div>
          </div>
        </header>

        <div className="p-6 md:p-8 max-w-7xl mx-auto">
          {/* Search Bar & Action */}
          <div className="mb-6 flex flex-col md:flex-row gap-4 md:items-end justify-between">
            <div className="flex-1">
              <InputField
                label="Buscar animais"
                placeholder="Digite nome, tipo ou raça..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button onClick={handleAddAnimal} variant="primary" className="mb-[2px]">
              <Plus size={20} className="mr-2" />
              Adicionar Animal
            </Button>
          </div>

          {/* Empty State */}
          {animals.length === 0 && (
            <EmptyState
              icon={<Cat size={48} className="text-slate-400" />}
              title="Nenhum animal cadastrado"
              description="Cadastre seu primeiro animal para começar a gerenciar seu rebanho."
              actionHref="/manageMyAnimals/addAnimal"
              actionLabel="+ Cadastrar Animal"
            />
          )}

          {/* Table */}
          {animals.length > 0 && (
            <>
              <div className="bg-white rounded-xl shadow-md overflow-hidden border border-slate-100">
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-[#1e3a29] text-white">
                      <tr>
                        <th className="p-4 text-left font-bold">Nome</th>
                        <th className="p-4 text-left font-bold hidden md:table-cell">
                          Tipo
                        </th>
                        <th className="p-4 text-left font-bold hidden md:table-cell">
                          Raça
                        </th>
                        <th className="p-4 text-left font-bold hidden md:table-cell">
                          Idade
                        </th>
                        <th className="p-4 text-left font-bold">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentAnimals.map((animal) => (
                        <tr
                          key={animal.id}
                          className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                        >
                          <td className="p-4">
                            <div className="flex flex-col">
                              <span className="font-semibold text-[#1e3a29]">
                                {animal.name}
                              </span>
                              <span className="text-sm text-slate-500 md:hidden">
                                {animal.animalType} • {animal.breed} • {animal.age} anos
                              </span>
                            </div>
                          </td>
                          <td className="p-4 hidden md:table-cell text-slate-700">
                            {animal.animalType}
                          </td>
                          <td className="p-4 hidden md:table-cell text-slate-700">
                            {animal.breed}
                          </td>
                          <td className="p-4 hidden md:table-cell text-slate-700">
                            {animal.age} anos
                          </td>
                          <td className="p-4">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleEditAnimal(animal)}
                                className="text-blue-600 hover:text-blue-800 p-2 hover:bg-blue-50 rounded transition-colors"
                                title="Editar"
                              >
                                <Edit size={18} />
                              </button>
                              <button
                                onClick={() => confirmDelete(animal.id)}
                                className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded transition-colors"
                                title="Excluir"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6">
                  <Button
                    onClick={() => paginate(currentPage - 1)}
                    disabled={currentPage === 1}
                    variant="outline"
                  >
                    Anterior
                  </Button>
                  <span className="text-slate-600 px-4">
                    Página {currentPage} de {totalPages}
                  </span>
                  <Button
                    onClick={() => paginate(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                    variant="outline"
                  >
                    Próximo
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
          <div className="bg-white p-6 rounded-2xl shadow-2xl max-w-sm w-full">
            <h2 className="text-xl font-bold text-[#1e3a29] mb-2">
              Confirmar Exclusão
            </h2>
            <p className="text-gray-600 mb-6">
              Tem certeza que deseja excluir este animal? Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-3">
              <Button
                onClick={() => setShowDeleteModal(false)}
                variant="outline"
                fullWidth
              >
                Cancelar
              </Button>
              <Button onClick={handleDeleteAnimal} variant="primary" fullWidth>
                Excluir
              </Button>
            </div>
          </div>
        </div>
      )}

      <ErrorModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Sucesso!"
        message={modalMessage}
        type="success"
      />

      <ErrorModal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        title="Erro"
        message={modalMessage}
        type="error"
      />
    </div>
  );
}
