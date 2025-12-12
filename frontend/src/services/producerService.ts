import { apiBase } from "./baseApi";
import { ProducerData } from "@/schemas/registration";
import { cleanDocument } from "@/utils/masks";

export const producerService = {
  create: async (data: ProducerData) => {
    const payload = {
      name: data.name,
      email: data.email,
      password: data.password,
      cpf: cleanDocument(data.cpf),
      phone: cleanDocument(data.phone),
      state: data.state,
      city: data.city,
      userCategory: data.userCategory,
      userType: data.userType,
    };

    const response = await apiBase.post("/users", payload);
    return response.data;
  },
};
