import { apiBase } from "./baseApi";
import { AssociationData } from "@/schemas/registration";
import { cleanDocument } from "@/utils/masks";
import { User } from "@/interfaces/user";
import { AssociateResponse, HerdStats, Association } from "@/interfaces/association";

export const associationService = {
  create: async (data: AssociationData): Promise<Association> => {
    const payload = {
      ...data,
      cnpj: cleanDocument(data.cnpj),
      phone: cleanDocument(data.phone),
      userCategory: "Juridica",
    };

    const response = await apiBase.post("/associations", payload);
    return response.data;
  },

  checkEmail: async (email: string): Promise<boolean> => {
    const { data } = await apiBase.get<{ exists: boolean }>(
      "/associations/check-email",
      { params: { email } }
    );
    return data.exists;
  },

  checkCnpj: async (cnpj: string): Promise<boolean> => {
    const cleanCnpj = cleanDocument(cnpj);
    const { data } = await apiBase.get<{ exists: boolean }>(
      "/associations/check-cnpj",
      { params: { cnpj: cleanCnpj } }
    );
    return data.exists;
  },

  findById: async (id: number): Promise<Association> => {
    const { data } = await apiBase.get(`/associations/${id}`);
    return data;
  },

  getAssociates: async (page = 1, limit = 10): Promise<AssociateResponse> => {
    const { data } = await apiBase.get<AssociateResponse>("/associations/metrics/associates", {
      params: { page, limit }
    });
    return data;
  },

  getHerdStats: async (): Promise<HerdStats> => {
    const { data } = await apiBase.get<HerdStats>("/associations/metrics/herd");
    return data;
  },

  getAvailableProducers: async (): Promise<User[]> => {
    const { data } = await apiBase.get("/associations/available-producers");
    return data;
  },

  inviteProducer: async (userId: number): Promise<void> => {
    await apiBase.post("/associations/invite", { userId });
  },

  update: async (id: number, updateData: Partial<Association>): Promise<void> => {
    await apiBase.patch(`/associations/${id}`, updateData);
  },
};
