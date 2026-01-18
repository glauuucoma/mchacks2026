from fastapi import FastAPI, HTTPException
from models.prediction import ScanRequest, GumloopResult
from services.gumloop import trigger_gumloop_flow
import uuid
import uvicorn
import yfinance as yf
import google.generativeai as genai
import json
import os
import requests
import datetime
from langdetect import detect
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
        print("⚠️ 2.5 Failed. Trying Gemini 2.0 Flash...")
        model = genai.GenerativeModel("gemini-2.0-flash")
    except:
        print("⚠️ Falling back to Gemini 1.5 Flash...")
        model = genai.GenerativeModel("gemini-1.5-flash")

app = FastAPI()
MEMORY_DB = {}

# ======================================================
# 2. GEMINI TECHNICAL ANALYSIS
# ======================================================
def get_gemini_technical_analysis(ticker: str):
    print(f"🧠 Asking Gemini to read charts for {ticker}...")

    try:
        stock = yf.Ticker(ticker)
        df = stock.history(period="3mo", auto_adjust=True)

        if df.empty:
            raise ValueError("Empty data")

        df_str = df[["Open", "High", "Low", "Close", "Volume"]].tail(60).to_string()
        print("   ✅ Real market data fetched.")

    except Exception as e:
        print(f"   ⚠️ Yahoo error ({e}). Using backup data.")
        df_str = """
        Date        Open    High    Low     Close   Volume
        (BACKUP)    120.5   125.0   119.0   124.5   50000000
        ...         ...     ...     ...     ...     ...
        (Today)     135.0   138.5   134.0   137.2   65000000
        """

    try:
        prompt = f"""
        Act as a professional technical analyst.

        Data:
        {df_str}

        CRITICAL:
        Return ONLY raw JSON with:
        - tech_score (0–50)
        - pattern_name
        """

        response = model.generate_content(prompt)
        clean_json = response.text.replace("```json", "").replace("```", "").strip()
        return json.loads(clean_json)

    except Exception as e:
        print(f"❌ Gemini parsing error: {e}")
        return {"tech_score": 25, "pattern_name": "Analysis Unavailable"}

# ======================================================
# 3. SCORING
# ======================================================
def calculate_final_score(tech_data: dict, sentiment):
    score = tech_data.get("tech_score", 25)

    reddit = sentiment.reddit_sentiment.lower()
    trader = sentiment.trader_signal.lower()

    # --- Reddit Logic ---
    if "bullish" in reddit:
        score += 15
    elif "bearish" in reddit:
        score -= 15
    else:
        score += 5  # Give 5 points for Neutral (not bearish is good!)

    # --- Trader Logic ---
    if "buy" in trader:
        score += 10
    elif "sell" in trader:
        score -= 10
    elif "holding" in trader:
        score += 5  # Give 5 points for Holding

    return max(0, min(100, score))

# ======================================================
# 4. API ENDPOINTS
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
    print(f"📩 Gumloop Result Received for {result.ticker}")
    print("📦 Payload:", result.dict())

    # NEW: Handle scans not in memory (for manual testing)
    if result.scan_id not in MEMORY_DB:
        print(f"⚠️ Scan ID {result.scan_id} not found. Creating placeholder entry.")
        MEMORY_DB[result.scan_id] = {
            "status": "gumloop_only",
            "ticker": result.ticker,
            "tech_data": {"tech_score": 25, "pattern_name": "Not Analyzed (Manual Test)"},
            "final_score": None
        }

    tech_data = MEMORY_DB[result.scan_id]["tech_data"]
    print(f"📊 TECH SCORE Breakdown: {tech_data}")
    final_score = calculate_final_score(tech_data, result)

    MEMORY_DB[result.scan_id].update({
        "status": "complete",
        "final_score": final_score,
        "analysis": {
            "chart_pattern": tech_data.get("pattern_name", "Unknown"),
            "tech_score": tech_data.get("tech_score", 25),
            "news_summary": result.news_summary,
            "reddit_vibe": result.reddit_sentiment,
            "trader_signal": result.trader_signal
        }
    })

    print(f"✅ SCAN COMPLETE: {final_score}/100")
    return {"status": "success"}

@app.get("/api/check_status/{scan_id}")
def check_status(scan_id: str):
    if scan_id not in MEMORY_DB:
        raise HTTPException(status_code=404, detail="Scan ID not found")

    return MEMORY_DB[scan_id]

@app.post("/api/get_news_headlines")
def get_news_headlines(data: dict):
    NEWS_API_KEY = '1071542b8f1c470786eb6ccf87080daf'
    
    ticker = data['ticker']
    day_offset = data.get('day_offset', 3)
    print(f"📰 Fetching news headlines for {ticker}")

    BASE_NEWS_API_URL = 'https://newsapi.org/v2/everything?'

    sort_by = "popularity"
    from_date = (datetime.datetime.now() - datetime.timedelta(days=day_offset)).strftime('%Y-%m-%d')

    url = (
        f"{BASE_NEWS_API_URL}"
        f'q={ticker}&'
        f'from={from_date}&'
        f'sortBy={sort_by}&'
        f'apiKey={NEWS_API_KEY}'
    )
    response = requests.get(url)

    # Filter to only English articles
    articles = response.json()['articles']
    articles = [article for article in articles if detect(article['title']) == 'en']

    return {
        "articles": articles,
        "status_code": response.status_code
    }

# ======================================================
# 5. RUN
# ======================================================
if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)