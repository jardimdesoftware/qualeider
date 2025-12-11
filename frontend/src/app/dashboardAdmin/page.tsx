"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/sidebar";
import { apiBase } from "@/services/baseApi";
import { Activity, Milk, Users, MapPin, BarChart2 } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { DailyCollection } from "@/interfaces/daily-collection";
import { User } from "@/interfaces/user";
import MetricCard from "@/components/metric-card";
import DashboardLoading from "@/components/dashboard/DashboardLoading";

export default function DashboardAdmin() {
  const router = useRouter();
  const [dailyCollections, setDailyCollections] = useState<DailyCollection[]>(
    []
  );
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

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
        fetchData(payload.associationId);
        setLoading(false);
      }
    } catch (err) {
      console.error("Erro ao decodificar o token:", err);
      router.push("/login");
    }
  }, [router]);

  const fetchData = async (associationId?: number) => {
    try {
      const token = localStorage.getItem("authToken");

      const queryParams = associationId ? `?associationId=${associationId}` : '';

      const collectionsResponse = await apiBase.get(`/daily-collections${queryParams}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setDailyCollections(collectionsResponse.data);

      const usersResponse = await apiBase.get(`/users${queryParams}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setUsers(usersResponse.data);
    } catch (err) {
      console.error("Erro ao buscar dados:", err); 
    }
  };

  // Funções para calcular as métricas
  const totalMilkThisMonth = dailyCollections
    .filter((collection) => {
      const collectionDate = new Date(collection.collectionDate);
      const today = new Date();
      return (
        collectionDate.getMonth() === today.getMonth() &&
        collectionDate.getFullYear() === today.getFullYear()
      );
    })
    .reduce((sum, collection) => sum + collection.quantity, 0);

  const averageLactationsThisMonth =
    dailyCollections.length > 0
      ? dailyCollections.reduce(
          (sum, collection) => sum + collection.numLactation,
          0
        ) / dailyCollections.length
      : 0;

  const totalMilkingThisMonth = dailyCollections
    .filter((collection) => {
      const collectionDate = new Date(collection.collectionDate);
      const today = new Date();
      return (
        collectionDate.getMonth() === today.getMonth() &&
        collectionDate.getFullYear() === today.getFullYear()
      );
    })
    .reduce((sum, collection) => sum + collection.numOrdens, 0);

  const technicalAssistanceUsageThisMonth =
    dailyCollections.length > 0
      ? (dailyCollections.filter((collection) => collection.technicalAssistance)
          .length /
          dailyCollections.length) *
        100
      : 0;

  const activeUsers = users.filter((user) => user.status === "Active").length;

  const usersFromBeloJardim = users.filter(
    (user) => user.city === "Belo Jardim"
  ).length;

  // Dados para o gráfico de pizza (distribuição de tipos de usuários)
  const userTypeDistribution = users
    .reduce((acc, user) => {
      acc[user.userType || "Outro"] = (acc[user.userType || "Outro"] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

  const pieChartData = Object.entries(userTypeDistribution).map(
    ([type, count]) => ({
      name: type,
      value: count,
    })
  );

  // Dados para o gráfico de linhas (quantidade de usuários por estado)
  const usersByState = users.reduce((acc, user) => {
    acc[user.state] = (acc[user.state] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const lineChartData = Object.entries(usersByState).map(([state, count]) => ({
    state,
    count,
  }));

  if (loading) {
    return <DashboardLoading />;
  }

  return (
    <div className="flex flex-col lg:flex-row">
      <Sidebar />
      <div className="flex-1 p-8">
        <h1 className="text-2xl font-bold mb-6 mt-12 md:mt-4">Dashboard</h1>

        {/* Cards com Métricas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 mb-8">
          <MetricCard
            icon={<Milk size={24} />}
            iconColor="text-blue-500"
            title="Leite Coletado (Mês)"
            value={totalMilkThisMonth.toFixed(2)}
            unit="litros"
          />

          <MetricCard
            icon={<Activity size={24} />}
            iconColor="text-purple-500"
            title="Média de Lactações (Mês)"
            value={averageLactationsThisMonth.toFixed(1)}
          />

          <MetricCard
            icon={<BarChart2 size={24} />}
            iconColor="text-yellow-500"
            title="Total de Ordenhas (Mês)"
            value={totalMilkingThisMonth}
          />

          <MetricCard
            icon={<Activity size={24} />}
            iconColor="text-red-500"
            title="Uso de Assistência Técnica (Mês)"
            value={`${technicalAssistanceUsageThisMonth.toFixed(1)}%`}
          />

          <MetricCard
            icon={<Users size={24} />}
            iconColor="text-green-500"
            title="Usuários Ativos"
            value={activeUsers}
          />

          <MetricCard
            icon={<MapPin size={24} />}
            iconColor="text-pink-500"
            title="Usuários de Belo Jardim"
            value={usersFromBeloJardim}
          />
        </div>

        {/* Gráficos */}
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Gráfico de Pizza - Distribuição de userType para usuários Common */}
          <div className="bg-white p-4 rounded-lg shadow flex-1 flex flex-col items-center">
            <h2 className="text-lg font-semibold mb-4">
              Distribuição de Tipos de Usuários
            </h2>
            <div className="w-full flex justify-center">
              <PieChart width={345} height={300}>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ percent }) => `(${(percent * 100).toFixed(0)}%)`}
                >
                  {pieChartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        ["#4E79A7", "#E15759", "#76B7B2", "#59A14F", "#F28E2B"][
                          index % 5
                        ]
                      }
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </div>
          </div>

          {/* Gráfico de Linhas - Quantidade de Usuários por Estado */}
          <div className="bg-white p-4 rounded-lg shadow flex-1 flex flex-col items-center">
            <h2 className="text-lg font-semibold mb-4">
              Quantidade de Usuários por Estado
            </h2>
            <div className="w-full h-[300px] flex justify-center items-center">
              <LineChart
                width={500}
                height={300}
                data={lineChartData}
                margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="state" />
                <YAxis />
                <Tooltip />
                <Legend
                  align="center"
                  wrapperStyle={{
                    paddingTop: 10,
                    textAlign: "center",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  name="Usuários"
                  stroke="#9467BD"
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </div>
          </div>
        </div>

        {/* Mensagem se não houver dados */}
        {dailyCollections.length === 0 && users.length === 0 && (
          <p className="text-gray-600 mt-8">
            Nenhum dado encontrado. Não há usuários, animais ou formulários
            cadastrados.
          </p>
        )}
      </div>
    </div>
  );
}
