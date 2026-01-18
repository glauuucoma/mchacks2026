export interface CongressTrade {
  id: string;
  size: string;
  reporting_gap: string;
  name: string;
  trade_type: string;
  filing_date: string;
  state: string;
  trade_date: string;
  party: string;
  photo_url?: string | null;
}

export const congressService = {
  getActivity: async (ticker: string): Promise<CongressTrade[]> => {
    const response = await fetch(`/api/congress?ticker=${encodeURIComponent(ticker)}`);
    
    if (!response.ok) {
      throw new Error("Failed to fetch congress data");
    }
    
    const data = await response.json();
    return data.data || [];
  },
};
