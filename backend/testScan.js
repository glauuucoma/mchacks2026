import axios from "axios";

const API_BASE = "http://localhost:8000";
const TICKER = "AMD";

// Small helper
const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

async function runTest() {
  try {
    console.log(`🚀 Starting scan for ${TICKER}...\n`);

    // 1️⃣ Start scan
    const startRes = await axios.post(`${API_BASE}/api/start_scan`, {
      ticker: TICKER
    });

    const scanId = startRes.data.scan_id;
    console.log(`🆔 Scan ID: ${scanId}`);

    // 2️⃣ Poll status
    let status = "processing";
    let result = null;

    while (status === "processing") {
      console.log("⏳ Waiting for analysis...");
      await sleep(4000);

      const checkRes = await axios.get(
        `${API_BASE}/api/check_status/${scanId}`
      );

      status = checkRes.data.status;

      if (status === "complete") {
        result = checkRes.data;
        break;
      }
    }

    // 3️⃣ Display results
    console.log("\n🔥 SCAN COMPLETE");
    console.log("────────────────────────");
    console.log(`📊 Final Score: ${result.final_score}/100`);
    console.log(`📈 Chart Pattern: ${result.analysis.chart_pattern}`);
    console.log(`💬 Reddit Sentiment: ${result.analysis.reddit_vibe}`);
    console.log(`📌 Trader Signal: ${result.analysis.trader_signal}`);
    console.log(`📰 News Summary: ${result.analysis.news_summary}`);
    console.log("────────────────────────\n");

  } catch (err) {
    console.error("❌ Test failed:", err.response?.data || err.message);
  }
}

runTest();
