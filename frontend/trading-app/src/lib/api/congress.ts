import { apiRequest } from "./client";

export const congressService = {
  getActivity: (ticker: string) => 
    apiRequest("/api/get_congress_activity", { 
      method: "POST", 
      body: JSON.stringify({ ticker }) 
    }),
};