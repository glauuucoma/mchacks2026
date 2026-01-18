from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware  # Added for frontend connection
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
# 1. SETUP & CONFIGURATION
# ======================================================
load_dotenv()
NEWS_API_KEY = os.getenv("NEWS_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
AI_INVEST_TOKEN = os.getenv("AI_INVEST_TOKEN")
EMAIL = os.getenv("EMAIL")

if not GEMINI_API_KEY:
    raise ValueError("❌ CRITICAL ERROR: GEMINI_API_KEY is missing")

genai.configure(api_key=GEMINI_API_KEY)

# Robust Model Loading
try:
    print("🧠 Attempting to load Gemini 2.0 Flash-Lite")
    model = genai.GenerativeModel("gemini-2.0-flash-lite-preview-02-05")
except Exception:
    print("⚠️ Falling back to Gemini 1.0 Pro...")
    model = genai.GenerativeModel("gemini-2.0-flash")

app = FastAPI()

origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
        df_str = "Date: 2024-01-01, Open: 150, Close: 155, Volume: 1000000"

    try:
        prompt = f"""
        Act as a professional technical analyst.
        Data: {df_str}
        CRITICAL: Return ONLY raw JSON with:
        - tech_score (number 0–50)
        - pattern_name (string)
        """
        response = model.generate_content(prompt)
        clean_json = response.text.replace("```json", "").replace("```", "").strip()
        return json.loads(clean_json)
    except Exception as e:
        print(f"❌ Gemini parsing error: {e}")
        return {"tech_score": 25, "pattern_name": "Analysis Unavailable"}

# ======================================================
# 3. SCORING LOGIC
# ======================================================
def calculate_final_score(tech_data: dict, sentiment):
    score = tech_data.get("tech_score", 25)
    reddit = sentiment.reddit_sentiment.lower()
    trader = sentiment.trader_signal.lower()

    if "bullish" in reddit: score += 15
    elif "bearish" in reddit: score -= 15
    else: score += 5 

    if "buy" in trader: score += 10
    elif "sell" in trader: score -= 10
    elif "holding" in trader: score += 5

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
    return {"scan_id": scan_id, "message": "Analysis started..."}

@app.post("/api/webhook/gumloop_result")
def receive_result(result: GumloopResult):
    if result.scan_id not in MEMORY_DB:
        MEMORY_DB[result.scan_id] = {
            "status": "gumloop_only",
            "ticker": result.ticker,
            "tech_data": {"tech_score": 25, "pattern_name": "Manual Test"},
            "final_score": None
        }

    tech_data = MEMORY_DB[result.scan_id]["tech_data"]
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
    return {"status": "success"}

@app.get("/api/check_status/{scan_id}")
def check_status(scan_id: str):
    if scan_id not in MEMORY_DB:
        raise HTTPException(status_code=404, detail="Scan ID not found")
    return MEMORY_DB[scan_id]

# ======================================================
# 5. DASHBOARDS
# ======================================================

@app.post("/api/get_news_headlines")
def get_news_headlines(data: dict):
    ticker = data['ticker']
    day_offset = data.get('day_offset', 3)
    from_date = (datetime.datetime.now() - datetime.timedelta(days=day_offset)).strftime('%Y-%m-%d')

    url = f"https://newsapi.org/v2/everything?q={ticker}&from={from_date}&sortBy=popularity&apiKey={NEWS_API_KEY}"
    response = requests.get(url)
    articles = response.json().get('articles', [])
    
    # Simple lang filter
    en_articles = [a for a in articles if detect(a['title']) == 'en'][:10]
    return {"articles": en_articles}

@app.post("/api/get_congress_activity")
def get_congress_activity(data: dict):
    ticker = data['ticker']
    page = data.get('page', 1)
    size = data.get('size', 10)

    # Get congress stock sales
    url = f"https://openapi.ainvest.com/open/ownership/congress?ticker={ticker}&page={page}&size={size}"
    headers = {"Authorization": f"Bearer {AI_INVEST_TOKEN}"}
    response = requests.get(url, headers=headers)

    congress_data = response.json()['data']['data']

    # Add photos
    for congress_datum in congress_data:
        person_name = congress_datum['name']
        photo_url = get_wikipedia_image(person_name)
        congress_datum['photo_url'] = photo_url
    
    return {
        "congress_data": congress_data,
        'message': "success"
    }

def get_wikipedia_image(person_name):
    search_url = "https://en.wikipedia.org/w/api.php"
    
    # Wikipedia requires a User-Agent header
    headers = {
        "User-Agent": f"MyApp/1.0 ({EMAIL})"  # Use your actual email
    }
    
    search_params = {
        "action": "query",
        "format": "json",
        "titles": person_name,
        "prop": "pageimages",
        "piprop": "original"
    }
    
    response = requests.get(search_url, params=search_params, headers=headers)
    data = response.json()
    pages = data['query']['pages']
    
    for page_id, page_data in pages.items():
        if 'original' in page_data:
            return page_data['original']['source']
    
    return None

# ======================================================
# 6. RUN
# ======================================================
if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)