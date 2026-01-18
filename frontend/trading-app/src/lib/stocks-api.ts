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

// Detailed stock data for the stock detail modal
export interface StockDetailData {
  quote: StockQuote | null;
  profile: CompanyProfile | null;
}

async function fetchStockDetail(ticker: string): Promise<StockDetailData> {
  const [quote, profile] = await Promise.all([
    fetchQuote(ticker).catch(() => null),
    fetchProfile(ticker).catch(() => null),
  ]);
  
  return { quote, profile };
}

export function useStockDetail(ticker: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ["stockDetail", ticker],
    queryFn: () => fetchStockDetail(ticker),
    enabled: enabled && !!ticker,
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });
}

// Stock Candle Data for Charts - Using Yahoo Finance API (free, no key required)
export interface ChartDataPoint {
  date: string;
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export type TimeRange = "1D" | "1W" | "1M" | "3M" | "6M" | "1Y" | "5Y";

interface YahooChartResponse {
  chart: {
    result: Array<{
      timestamp: number[];
      indicators: {
        quote: Array<{
          open: number[];
          high: number[];
          low: number[];
          close: number[];
          volume: number[];
        }>;
      };
    }>;
    error: null | { code: string; description: string };
  };
}

function getYahooParams(range: TimeRange): { interval: string; range: string } {
  switch (range) {
    case "1D":
      return { interval: "5m", range: "1d" };
    case "1W":
      return { interval: "15m", range: "5d" };
    case "1M":
      return { interval: "1h", range: "1mo" };
    case "3M":
      return { interval: "1d", range: "3mo" };
    case "6M":
      return { interval: "1d", range: "6mo" };
    case "1Y":
      return { interval: "1d", range: "1y" };
    case "5Y":
      return { interval: "1wk", range: "5y" };
    default:
      return { interval: "1d", range: "1mo" };
  }
}

async function fetchStockCandles(ticker: string, range: TimeRange): Promise<ChartDataPoint[]> {
  const { interval, range: yahooRange } = getYahooParams(range);
  
  // Use our API route to avoid CORS issues
  const res = await fetch(
    `/api/chart?ticker=${ticker}&interval=${interval}&range=${yahooRange}`
  );
  
  if (!res.ok) throw new Error(`Failed to fetch chart data for ${ticker}`);
  
  const data: YahooChartResponse = await res.json();
  
  if (data.chart.error || !data.chart.result?.[0]) {
    throw new Error(data.chart.error?.description || "No chart data available");
  }
  
  const result = data.chart.result[0];
  const timestamps = result.timestamp;
  const quote = result.indicators.quote[0];
  
  if (!timestamps || !quote.close) {
    return [];
  }
  
  return timestamps
    .map((timestamp, index) => ({
      date: new Date(timestamp * 1000).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: range === "5Y" || range === "1Y" ? "2-digit" : undefined,
        hour: range === "1D" || range === "1W" ? "numeric" : undefined,
        minute: range === "1D" ? "2-digit" : undefined,
      }),
      time: timestamp,
      open: quote.open[index] ?? 0,
      high: quote.high[index] ?? 0,
      low: quote.low[index] ?? 0,
      close: quote.close[index] ?? 0,
      volume: quote.volume[index] ?? 0,
    }))
    .filter((point) => point.close > 0); // Filter out null/invalid data points
}

export function useStockCandles(ticker: string, range: TimeRange, enabled: boolean = true) {
  return useQuery({
    queryKey: ["stockCandles", ticker, range],
    queryFn: () => fetchStockCandles(ticker, range),
    enabled: enabled && !!ticker,
    staleTime: range === "1D" ? 60000 : 300000, // 1 min for daily, 5 min for longer
    refetchOnWindowFocus: false,
  });
}

// Basic Financials / Metrics
export interface BasicFinancials {
  metric: {
    "10DayAverageTradingVolume"?: number;
    "52WeekHigh"?: number;
    "52WeekLow"?: number;
    "52WeekHighDate"?: string;
    "52WeekLowDate"?: string;
    beta?: number;
    peBasicExclExtraTTM?: number;       // P/E ratio (TTM)
    peTTM?: number;                      // Alternative P/E
    pbAnnual?: number;                   // Price to Book
    psAnnual?: number;                   // Price to Sales
    dividendYieldIndicatedAnnual?: number;
    epsBasicExclExtraItemsTTM?: number; // EPS
    epsTTM?: number;                     // Alternative EPS
    revenuePerShareTTM?: number;
    bookValuePerShareAnnual?: number;
    currentRatioAnnual?: number;
    quickRatioAnnual?: number;
    roaRfy?: number;                     // Return on Assets
    roeRfy?: number;                     // Return on Equity
    roiAnnual?: number;                  // Return on Investment
    grossMarginTTM?: number;
    operatingMarginTTM?: number;
    netProfitMarginTTM?: number;
    debtEquityAnnual?: number;
    longTermDebtEquityAnnual?: number;
    payoutRatioAnnual?: number;
    revenueGrowthTTMYoy?: number;
    epsGrowthTTMYoy?: number;
  };
  series?: {
    annual?: Record<string, { period: string; v: number }[]>;
    quarterly?: Record<string, { period: string; v: number }[]>;
  };
}

async function fetchBasicFinancials(ticker: string): Promise<BasicFinancials | null> {
  try {
    const res = await fetch(
      `${BASE_URL}/stock/metric?symbol=${ticker}&metric=all&token=${FINNHUB_API_KEY}`
    );
    
    if (!res.ok) return null;
    
    const data = await res.json();
    return data;
  } catch (error) {
    console.error(`Error fetching financials for ${ticker}:`, error);
    return null;
  }
}

export function useBasicFinancials(ticker: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ["basicFinancials", ticker],
    queryFn: () => fetchBasicFinancials(ticker),
    enabled: enabled && !!ticker,
    staleTime: 300000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}
