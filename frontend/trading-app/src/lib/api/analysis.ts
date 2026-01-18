import { apiRequest } from "./client";

export const analysisService = {
  // Call this to trigger a new scan
  startScan: (ticker: string) => 
    apiRequest("/api/start_scan", { 
      method: "POST", 
      body: JSON.stringify({ ticker }) 
    }),

  // Call this every few seconds to check results
  checkStatus: (scanId: string) => 
    apiRequest(`/api/check_status/${scanId}`),
};