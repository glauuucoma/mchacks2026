// Example usage in a React component
import { postGumloopResult } from "@/lib/api";

function GumloopButton() {
  const handleClick = async () => {
    try {
      const result = await postGumloopResult({
        scan_id: "your-scan-id",
        ticker: "AAPL",
        news_summary: "Sample news summary",
        reddit_sentiment: "Bullish",
        trader_signal: "Buy",
      });
      console.log("API result:", result);
    } catch (err) {
      console.error("API error:", err);
    }
  };

  return <button onClick={handleClick}>Send Gumloop Result</button>;
}

export default GumloopButton;