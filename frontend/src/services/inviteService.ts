
import { apiBase } from "./baseApi";

// Types
export interface Invite {
  id: number;
  token: string;
  association: {
    id: number;
    name: string;
  };
  message: string | null;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED' | 'CANCELED';
  sentAt: string;
}

export const inviteService = {
  createInvite: async (associationId: number, userId: number, message?: string) => {
    const { data } = await apiBase.post(`/invites/association/${associationId}`, 
      { userId, message }
    );
    return data;
  },

  getUserPendingInvites: async (userId: number): Promise<Invite[]> => {
    const { data } = await apiBase.get(`/invites/user/${userId}/pending`);
    return data;
  },

  respondToInvite: async (token: string, response: 'Accept' | 'Decline') => {
    const { data } = await apiBase.patch(`/invites/token/${token}/respond`, 
      { response }
    );
    return data;
  }
};
