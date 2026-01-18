import { useQuery } from "@tanstack/react-query";

// Finnhub API - free tier available
// Get your API key at: https://finnhub.io/
const FINNHUB_API_KEY = process.env.NEXT_PUBLIC_FINNHUB_API_KEY || "demo";
const BASE_URL = "https://finnhub.io/api/v1";

export interface StockQuote {
  c: number;  // Current price
  d: number;  // Change
  dp: number; // Percent change
  h: number;  // High price of the day
  l: number;  // Low price of the day
  o: number;  // Open price of the day
  pc: number; // Previous close price
  t: number;  // Timestamp
}

export interface CompanyProfile {
  country: string;
  currency: string;
  exchange: string;
  ipo: string;
  marketCapitalization: number;
  name: string;
  phone: string;
  shareOutstanding: number;
  ticker: string;
  weburl: string;
  logo: string;
  finnhubIndustry: string;
}

export interface StockData {
  ticker: string;
  name: string;
  price: number;
  change1h: number;
  change24h: number;
  change7d: number;
  volume: number;
  marketCap: number;
  logo?: string;
}

// Fetch single stock quote
async function fetchQuote(ticker: string): Promise<StockQuote> {
  const res = await fetch(
    `${BASE_URL}/quote?symbol=${ticker}&token=${FINNHUB_API_KEY}`
  );
  if (!res.ok) throw new Error(`Failed to fetch quote for ${ticker}`);
  return res.json();
}

// Fetch company profile
async function fetchProfile(ticker: string): Promise<CompanyProfile> {
  const res = await fetch(
    `${BASE_URL}/stock/profile2?symbol=${ticker}&token=${FINNHUB_API_KEY}`
  );
  if (!res.ok) throw new Error(`Failed to fetch profile for ${ticker}`);
  return res.json();
}

// Combine quote and profile into StockData
async function fetchStockData(ticker: string): Promise<StockData> {
  const [quote, profile] = await Promise.all([
    fetchQuote(ticker),
    fetchProfile(ticker),
  ]);

  // Finnhub only provides daily change, so we simulate 1h/7d for demo
  // In production, you'd use historical data endpoint
  const dailyChange = quote.dp || 0;
  
  return {
    ticker,
    name: profile.name || ticker,
    price: quote.c || 0,
    change1h: dailyChange * 0.1, // Simulated - use real historical data in production
    change24h: dailyChange,
    change7d: dailyChange * 2.5, // Simulated - use real historical data in production  
    volume: Math.round((profile.shareOutstanding || 0) * 1000000 * 0.01), // Estimate
    marketCap: (profile.marketCapitalization || 0) * 1000000, // Finnhub returns in millions
    logo: profile.logo,
  };
}

// Fetch multiple stocks in parallel with rate limiting
async function fetchMultipleStocks(tickers: string[]): Promise<StockData[]> {
  // Batch fetch with small delay between requests to respect rate limits
  const results: StockData[] = [];
  
  for (const ticker of tickers) {
    try {
      const data = await fetchStockData(ticker);
      results.push(data);
    } catch (error) {
      console.error(`Error fetching ${ticker}:`, error);
      // Return placeholder data on error
      results.push({
        ticker,
        name: ticker,
        price: 0,
        change1h: 0,
        change24h: 0,
        change7d: 0,
        volume: 0,
        marketCap: 0,
      });
    }
    // Small delay to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  
  return results;
}

// React Query hook for fetching stock data
export function useStocksData(tickers: string[]) {
  return useQuery({
    queryKey: ["stocks", tickers.sort().join(",")],
    queryFn: () => fetchMultipleStocks(tickers),
    enabled: tickers.length > 0,
    staleTime: 30000, // Consider data fresh for 30 seconds
    refetchInterval: 60000, // Refetch every minute
    refetchOnWindowFocus: false, // Don't refetch on window focus to save API calls
  });
}

// Fear and Greed Index - using CNN's Fear & Greed API (simulated)
// In production, you'd use a real API like Alternative.me or scrape CNN
export interface FearGreedData {
  value: number;
  valueClassification: string;
  timestamp: string;
}

async function fetchFearGreedIndex(): Promise<FearGreedData> {
  // Using Alternative.me API for crypto fear & greed (also applies to general market sentiment)
  // For stocks specifically, you could use CNN Fear & Greed
  try {
    const res = await fetch("https://api.alternative.me/fng/?limit=1");
    const data = await res.json();
    
    if (data.data && data.data[0]) {
      return {
        value: parseInt(data.data[0].value),
        valueClassification: data.data[0].value_classification,
        timestamp: data.data[0].timestamp,
      };
    }
  } catch (error) {
    console.error("Error fetching Fear & Greed index:", error);
  }
  
  // Fallback mock data
  return {
    value: 45,
    valueClassification: "Fear",
    timestamp: new Date().toISOString(),
  };
}

export function useFearGreedIndex() {
  return useQuery({
    queryKey: ["fearGreed"],
    queryFn: fetchFearGreedIndex,
    staleTime: 300000, // 5 minutes
    refetchInterval: 300000,
    refetchOnWindowFocus: false,
  });
}

// Stock search for adding new tickers
async function searchStocks(query: string): Promise<{ symbol: string; description: string }[]> {
  if (!query || query.length < 1) return [];
  
  const res = await fetch(
    `${BASE_URL}/search?q=${encodeURIComponent(query)}&token=${FINNHUB_API_KEY}`
  );
  
  if (!res.ok) return [];
  
  const data = await res.json();
  return (data.result || [])
    .filter((item: { type: string }) => item.type === "Common Stock")
    .slice(0, 10)
    .map((item: { symbol: string; description: string }) => ({
      symbol: item.symbol,
      description: item.description,
    }));
}

export function useStockSearch(query: string) {
  return useQuery({
    queryKey: ["stockSearch", query],
    queryFn: () => searchStocks(query),
    enabled: query.length >= 1,
    staleTime: 60000,
    refetchOnWindowFocus: false,
  });
}
