const API_URL = process.env.NEXT_PUBLIC_API_URL;

// STEP 1: Start the scan (This is what you already have)
export const startScan = async (ticker: string) => {
  const res = await fetch(`${API_URL}/api/start_scan`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ticker })
  });
  return res.json(); // Returns { scan_id: "..." }
};

// STEP 2: Check the status (The missing piece)
export const checkScanStatus = async (scanId: string) => {
  const res = await fetch(`${API_URL}/api/check_status/${scanId}`);
  return res.json(); // Returns { status: "waiting" } or { status: "complete", final_score: 85, ... }
};