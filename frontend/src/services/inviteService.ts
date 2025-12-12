
import { apiBase } from "./baseApi";

// Types
export interface Invite {
  id: number;
  association: {
    id: number;
    name: string;
  };
  message: string | null;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED' | 'CANCELED';
  sentAt: string;
}

export const inviteService = {
  /**
   * Association sends an invite to a user
   */
  createInvite: async (associationId: number, userId: number, message?: string) => {
    const token = localStorage.getItem("authToken");
    const { data } = await apiBase.post(`/invites/association/${associationId}`, 
      { userId, message },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return data;
  },

  /**
    * Get pending invites for the current user
    */
  getUserPendingInvites: async (userId: number): Promise<Invite[]> => {
    const token = localStorage.getItem("authToken");
    const { data } = await apiBase.get(`/invites/user/${userId}/pending`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return data;
  },

  /**
   * Respond to an invite (ACCEPT or DECLINE)
   */
  respondToInvite: async (token: string, response: 'Accept' | 'Decline') => {
    const authToken = localStorage.getItem("authToken");
    const { data } = await apiBase.patch(`/invites/token/${token}/respond`, 
      { response },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    return data;
  }
};
