from fastapi import FastAPI, HTTPException
from models.prediction import ScanRequest, GumloopResult
from services.gumloop import trigger_gumloop_flow
import uuid
import uvicorn
import yfinance as yf
import google.generativeai as genai
import json
import os
from dotenv import load_dotenv

# ======================================================
# 1. SETUP
# ======================================================
load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    raise ValueError("❌ CRITICAL ERROR: GEMINI_API_KEY is missing")

genai.configure(api_key=GEMINI_API_KEY)

try:
    print("🧠 Attempting to load Gemini 2.5 Flash...")
    model = genai.GenerativeModel("gemini-2.5-flash")
except:
    try:
        print("⚠️ Trying Gemini 2.0 Flash...")
        model = genai.GenerativeModel("gemini-2.0-flash")
    except:
        print("⚠️ Falling back to Gemini 1.5 Flash...")
        model = genai.GenerativeModel("gemini-1.5-flash")

app = FastAPI()
MEMORY_DB = {}

# ======================================================
# 2. GEMINI TECH ANALYSIS
# ======================================================
def get_gemini_technical_analysis(ticker: str):
    print(f"🧠 Asking Gemini to read charts for {ticker}...")

    try:
        stock = yf.Ticker(ticker)
        df = stock.history(period="3mo", auto_adjust=True)
        if df.empty:
            raise ValueError("Empty data")

        df_str = df[["Open", "High", "Low", "Close", "Volume"]].tail(60).to_string()
        print("   ✅ Market data fetched")

    except Exception as e:
        print(f"⚠️ Yahoo error ({e}) — using backup")
        df_str = """
        Open High Low Close Volume
        120 125 119 124 50M
        130 138 134 137 65M
        """

    try:
        prompt = f"""
        Act as a professional technical analyst.

        Data:
        {df_str}

        Return ONLY raw JSON:
        {{
          "tech_score": number (0–50),
          "pattern_name": string
        }}
        """

        response = model.generate_content(prompt)
        clean = response.text.replace("```json", "").replace("```", "").strip()
        return json.loads(clean)

    except Exception as e:
        print("❌ Gemini error:", e)
        return {"tech_score": 25, "pattern_name": "Unavailable"}

# ======================================================
# 3. SCORING
# ======================================================
def calculate_final_score(tech_data: dict, sentiment: GumloopResult):
    score = tech_data.get("tech_score", 25)

    reddit = (sentiment.reddit_sentiment or "neutral").lower()
    trader = (sentiment.trader_signal or "none").lower()

    if "bullish" in reddit:
        score += 15
    elif "bearish" in reddit:
        score -= 15

    if "buy" in trader:
        score += 10
    elif "sell" in trader:
        score -= 10

    return max(0, min(100, score))

# ======================================================
# 4. ENDPOINTS
# ======================================================
@app.post("/api/start_scan")
def start_scan(request: ScanRequest):
    scan_id = str(uuid.uuid4())

    tech_data = get_gemini_technical_analysis(request.ticker)

    MEMORY_DB[scan_id] = {
        "status": "waiting_for_gumloop",
        "ticker": request.ticker,
        "tech_data": tech_data,
        "final_score": None
    }

    trigger_gumloop_flow(scan_id, request.ticker)

    return {
        "scan_id": scan_id,
        "message": "Charts analyzed. Waiting for social data..."
    }

@app.post("/api/webhook/gumloop_result")
def receive_result(result: GumloopResult):
    print("📩 Webhook received:", result.dict())

    if result.scan_id not in MEMORY_DB:
        return {"status": "error", "reason": "Scan ID not found"}

    tech_data = MEMORY_DB[result.scan_id]["tech_data"]
    final_score = calculate_final_score(tech_data, result)

    MEMORY_DB[result.scan_id].update({
        "status": "complete",
        "final_score": final_score,
        "analysis": {
            "chart_pattern": tech_data.get("pattern_name"),
            "tech_score": tech_data.get("tech_score"),
            "news_summary": result.news_summary,
            "reddit_vibe": result.reddit_sentiment,
            "trader_signal": result.trader_signal
        }
    })

    print(f"✅ COMPLETE — Score {final_score}/100")
    return {"status": "success"}

@app.get("/api/check_status/{scan_id}")
def check_status(scan_id: str):
    if scan_id not in MEMORY_DB:
        raise HTTPException(status_code=404, detail="Scan ID not found")
    return MEMORY_DB[scan_id]

# ======================================================
# 5. RUN
# ======================================================
if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
