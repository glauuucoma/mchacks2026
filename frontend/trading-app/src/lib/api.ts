export async function postGumloopResult(payload: {
  scan_id: string;
  ticker: string;
  news_summary: string;
  reddit_sentiment: string;
  trader_signal: string;
}) {
  const res = await fetch("http://127.0.0.1:8000/api/webhook/gumloop_result", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}