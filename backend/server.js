import express from 'express';
import cors from 'cors';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const MEMORY_DB = {};
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ==========================================
// 1. CHART PATTERN ANALYSIS (GEMINI)
// ==========================================
async function getGeminiAnalysis(ticker) {
  try {
    console.log(`\n🧠 Gemini is reading charts for ${ticker}...`);

    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?range=3mo&interval=1d`;
    const response = await axios.get(url);
    const result = response.data.chart.result[0];
    const quotes = result.indicators.quote[0];

    const dataSummary = result.timestamp.slice(-10).map((t, i) => ({
      date: new Date(t * 1000).toISOString().split("T")[0],
      close: quotes.close[i]?.toFixed(2)
    }));

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `
Act as a professional trader.
Analyze the following price data for ${ticker}.
Return ONLY valid JSON:
{"tech_score": 0-50, "pattern_name": "string"}

DATA:
${JSON.stringify(dataSummary)}
`;

    const aiResponse = await model.generateContent(prompt);
    const cleaned = aiResponse.response.text().replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    console.log(`✅ Chart Pattern: ${parsed.pattern_name} (${parsed.tech_score}/50)`);
    return parsed;

  } catch (err) {
    console.error("❌ Gemini chart error:", err.message);
    return { tech_score: 25, pattern_name: "Standard Analysis" };
  }
}

// ==========================================
// 2. SCORING LOGIC
// ==========================================
function calculateFinalScore(techScore, sentiment) {
  let score = techScore;

  const reddit = (sentiment.reddit_sentiment || "").toLowerCase();
  const trader = (sentiment.trader_signal || "").toLowerCase();

  if (reddit.includes("bullish")) score += 25;
  else if (reddit.includes("bearish")) score -= 10;
  else score += 5;

  if (trader.includes("buy")) score += 25;
  else if (trader.includes("sell")) score -= 10;

  return Math.max(0, Math.min(100, score));
}

// ==========================================
// 3. SCAN ENDPOINT
// ==========================================
app.post("/api/start_scan", async (req, res) => {
  const { ticker } = req.body;
  if (!ticker) return res.status(400).json({ error: "Ticker required" });

  const scanId = uuidv4();
  const techData = await getGeminiAnalysis(ticker);

  MEMORY_DB[scanId] = {
    status: "processing",
    ticker,
    tech_data: techData,
    final_score: null
  };

  try {
    const startRes = await axios.post(
      "https://api.gumloop.com/api/v1/start_pipeline",
      {
        user_id: process.env.GUMLOOP_USER_ID,
        saved_item_id: process.env.GUMLOOP_PIPELINE_ID,
        pipeline_inputs: [
          { input_name: "ticker", value: ticker },
          { input_name: "scan_id", value: scanId }
        ]
      },
      { headers: { Authorization: `Bearer ${process.env.GUMLOOP_TOKEN}` } }
    );

    const runId = startRes.data.run_id;
    console.log(`📡 Gumloop started (${runId})`);

    let state = "RUNNING";
    let sentimentResult = null;

    while (state === "RUNNING") {
      await new Promise(r => setTimeout(r, 4000));

      const checkRes = await axios.get(
        `https://api.gumloop.com/api/v1/get_pl_run?run_id=${runId}&user_id=${process.env.GUMLOOP_USER_ID}`,
        { headers: { Authorization: `Bearer ${process.env.GUMLOOP_TOKEN}` } }
      );

      state = checkRes.data.state;
      console.log(`⏱️ Gumloop status: ${state}`);

      if (state === "DONE") {
        const outputs = checkRes.data.outputs;

        // 🔥 BULLETPROOF GUMLOOP PARSING
        let parsed = null;

        // 1️⃣ Clean object
        if (outputs.analysis_result && typeof outputs.analysis_result === "object" && !Array.isArray(outputs.analysis_result)) {
          parsed = outputs.analysis_result;

        // 2️⃣ Array output
        } else if (Array.isArray(outputs.analysis_result) && outputs.analysis_result.length > 0) {
          parsed = outputs.analysis_result[0];

        // 3️⃣ String fallback
        } else {
          const raw =
            outputs.analysis_result ||
            outputs.output_json ||
            outputs.text ||
            "";

          if (typeof raw === "string") {
            const match = raw.match(/\{[\s\S]*\}/);
            if (match) {
              parsed = JSON.parse(match[0]);
            }
          }
        }

        // 4️⃣ Final safety check
        if (!parsed || typeof parsed !== "object") {
          throw new Error("Gumloop returned no usable JSON");
        }

        // Normalize keys
        sentimentResult = Object.fromEntries(
          Object.entries(parsed).map(([k, v]) => [k.toLowerCase(), v])
        );

        console.log("✅ Gumloop sentiment extracted");
        break;
      }

      if (state === "FAILED") {
        throw new Error("Gumloop pipeline failed");
      }
    }

    if (!sentimentResult) {
      sentimentResult = {
        reddit_sentiment: "Neutral",
        trader_signal: "Holding",
        news_summary: "No data available"
      };
    }

    const finalScore = calculateFinalScore(
      techData.tech_score,
      sentimentResult
    );

    const finalPayload = {
      chart_pattern: techData.pattern_name,
      news_summary: sentimentResult.news_summary || "No recent news found",
      reddit_vibe: sentimentResult.reddit_sentiment,
      trader_signal: sentimentResult.trader_signal
    };

    MEMORY_DB[scanId] = {
      status: "complete",
      ticker,
      tech_data: techData,
      final_score: finalScore,
      analysis: finalPayload
    };

    console.log(`\n🔥 SCAN COMPLETE for ${ticker}`);
    console.log(`📊 SCORE: ${finalScore}/100`);
    console.log(`💬 Reddit: ${finalPayload.reddit_vibe}`);
    console.log(`📈 Signal: ${finalPayload.trader_signal}\n`);

    res.json({
      scan_id: scanId,
      status: "complete",
      final_score: finalScore,
      analysis: finalPayload
    });

  } catch (err) {
    console.error("❌ Scan failed:", err.message);
    res.status(500).json({ error: "Analysis pipeline failed" });
  }
});

// ==========================================
app.get("/api/check_status/:scan_id", (req, res) => {
  const scan = MEMORY_DB[req.params.scan_id];
  if (!scan) return res.status(404).json({ error: "Not found" });
  res.json(scan);
});

app.listen(8000, () => {
  console.log("🚀 Trading API running on port 8000");
});
