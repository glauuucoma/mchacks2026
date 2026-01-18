import requests
import json
import os
from dotenv import load_dotenv

load_dotenv()
GUMLOOP_WEBHOOK_URL = os.getenv("GUMLOOP_WEBHOOK_URL")

def trigger_gumloop_flow(scan_id: str, ticker: str):
    if not GUMLOOP_WEBHOOK_URL:
        print("❌ ERROR: GUMLOOP_WEBHOOK_URL is missing")
        return False

    # --- CHANGE HERE: Match the exact names from your Gumloop Start Node ---
    payload = {
        "ticker": ticker,      # Was "ticker_to_scan"
        "scan_id": scan_id     # Was "callback_id"
    }
    
    headers = {"Content-Type": "application/json"}

    print(f"📡 Dispatching Gumloop Agent for {ticker}...")

    try:
        requests.post(GUMLOOP_WEBHOOK_URL, data=json.dumps(payload), headers=headers, timeout=5)
        print(f"✅ Agent Dispatched (ID: {scan_id})")
        return True
    except Exception as e:
        print(f"❌ Failed to dispatch agent: {e}")
        return False