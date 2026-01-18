/**
 * Stock Detail Page
 * 
 * Main page component for displaying detailed information about a specific stock.
 * 
 * ============================================================================
 * FILE STRUCTURE OVERVIEW
 * ============================================================================
 * 
 * This page uses modular components organized in the ./components folder:
 * 
 * 📁 components/
 * ├── index.ts              - Barrel exports for all components
 * ├── DataCell.tsx          - Reusable data cell with icon and label
 * ├── StockInfoTab.tsx      - Main stock info tab with sub-sections:
 * │   ├── SummarySection
 * │   ├── PriceChartSection
 * │   ├── MarketDataSection
 * │   ├── FinancialMetricsSection (expandable)
 * │   ├── CompanyInfoSection (expandable)
 * │   └── AIAnalysisSidebar
 * ├── InsiderKnowledgeTab.tsx - Congressional trading activity
 * │   ├── TabHeader
 * │   ├── TradeCard
 * │   └── EmptyState
 * └── AIAnalysisTab.tsx     - AI analysis results with barometer
 *     ├── EmptyState
 *     ├── BarometerCard
 *     └── SourceBreakdown
 * 
 * 📁 data.ts - Types, constants, and configuration
 * 
 * ============================================================================
 * PAGE SECTIONS
 * ============================================================================
 * 
 * 1. NAVIGATION BAR - Sticky header with back button
 * 2. STOCK HEADER - Logo, name, ticker, price, change
 * 3. TAB NAVIGATION - Stock Info | Insider Knowledge | AI Analysis
 * 4. TAB CONTENT - Dynamic content based on selected tab
 * 
 * ============================================================================
 * STATE MANAGEMENT
 * ============================================================================
 * 
 * - Stock data: useStockDetail, useStockCandles, useBasicFinancials hooks
 * - UI state: activeTab, selectedRange, expanded sections
 * - Analysis state: isAnalyzing, currentStep, completedSteps, result
 * - Congress data: congressData, isCongressLoading
 * - Preferences: sourceWeights from global store
 * 
 */

"use client";

import { useState, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useStockDetail,
  useStockCandles,
  useBasicFinancials,
  type TimeRange,
} from "@/lib/stocks-api";
import {
  formatPrice,
  formatMarketCap,
  formatChange,
} from "@/components/dashboard/utils";
import usePreferencesStore from "@/store/preferences";
import { congressService } from "@/lib/api/congress";

// Local imports
import {
  type TabType,
  type AnalysisState,
  type CongressPerson,
  ANALYSIS_STEPS,
  TABS,
} from "./data";
import {
  StockInfoTab,
  InsiderKnowledgeTab,
  AIAnalysisTab,
} from "./components";
import AskAIChat from "@/components/dashboard/AskAIChat";

// =============================================================================
// MAIN PAGE COMPONENT
// =============================================================================

export default function StockDetailPage() {
  // ---------------------------------------------------------------------------
  // ROUTING & PARAMS
  // ---------------------------------------------------------------------------
  const params = useParams();
  const router = useRouter();
  const ticker = (params.ticker as string)?.toUpperCase() || "";

  // ---------------------------------------------------------------------------
  // DATA FETCHING HOOKS
  // ---------------------------------------------------------------------------
  const { data: stock, isLoading, isError } = useStockDetail(ticker, true);
  const [selectedRange, setSelectedRange] = useState<TimeRange>("1M");
  const { data: candleData, isLoading: candlesLoading } = useStockCandles(
    ticker,
    selectedRange,
    !!ticker
  );
  const { data: financials } = useBasicFinancials(ticker, !!ticker);

  // ---------------------------------------------------------------------------
  // UI STATE
  // ---------------------------------------------------------------------------
  const [activeTab, setActiveTab] = useState<TabType>("stock-info");
  const [isMetricsExpanded, setIsMetricsExpanded] = useState(false);
  const [isCompanyInfoExpanded, setIsCompanyInfoExpanded] = useState(false);

  // ---------------------------------------------------------------------------
  // ANALYSIS STATE
  // ---------------------------------------------------------------------------
  const [analysis, setAnalysis] = useState<AnalysisState>({
    isAnalyzing: false,
    currentStep: 0,
    completedSteps: [],
    result: null,
  });
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [recommendation, setRecommendation] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // CONGRESS DATA STATE
  // ---------------------------------------------------------------------------
  const [congressData, setCongressData] = useState<CongressPerson[]>([]);
  const [isCongressLoading, setIsCongressLoading] = useState(false);

  // ---------------------------------------------------------------------------
  // GLOBAL PREFERENCES
  // ---------------------------------------------------------------------------
  const { sourceWeights } = usePreferencesStore();

  // ---------------------------------------------------------------------------
  // COMPUTED VALUES
  // ---------------------------------------------------------------------------
  
  /** Calculate price change from chart data */
  const chartPriceChange = useMemo(() => {
    if (!candleData || candleData.length < 2) return null;
    const firstPrice = candleData[0].close;
    const lastPrice = candleData[candleData.length - 1].close;
    const change = lastPrice - firstPrice;
    const changePercent = (change / firstPrice) * 100;
    return { change, changePercent, isPositive: change >= 0 };
  }, [candleData]);

  /** Check if stock price is positive */
  const isPositive = (stock?.quote?.dp ?? 0) >= 0;

  /** Stock context for AI chat */
  const stockContext = {
    ticker,
    name: stock?.profile?.name || ticker,
    price: stock?.quote?.c || 0,
    change: stock?.quote?.dp || 0,
    marketCap: formatMarketCap((stock?.profile?.marketCapitalization ?? 0) * 1000000),
    industry: stock?.profile?.finnhubIndustry || "Unknown",
  };

  // ---------------------------------------------------------------------------
  // EVENT HANDLERS
  // ---------------------------------------------------------------------------

  /** Handle tab change and fetch data when needed */
  const handleTabChange = async (tab: TabType) => {
    setActiveTab(tab);
    
    // Fetch congress data when switching to insider knowledge tab
    if (tab === "insider-knowledge" && congressData.length === 0) {
      setIsCongressLoading(true);
      try {
        const data = await congressService.getActivity(ticker);
        console.log("Congress API response:", data);
        setCongressData(data || []);
      } catch (error) {
        console.error("Failed to fetch congress data:", error);
        setCongressData([]);
      } finally {
        setIsCongressLoading(false);
      }
    }
  };

  /** Analyze Congress data to determine buy/sell/hold rating */
  const analyzeCongressData = useCallback((trades: CongressPerson[]): number => {
    if (!trades || trades.length === 0) {
      return 0; // HOLD if no data
    }

    let buyCount = 0;
    let sellCount = 0;

    trades.forEach((trade) => {
      const tradeType = trade.trade_type?.toLowerCase();
      if (tradeType === "buy") {
        buyCount++;
      } else if (tradeType === "sell") {
        sellCount++;
      }
    });

    // If no valid trades, return HOLD (0)
    if (buyCount === 0 && sellCount === 0) {
      return 0;
    }

    const total = buyCount + sellCount;
    const buyRatio = buyCount / total;
    const sellRatio = sellCount / total;

    if (buyRatio > 0.5) {
      // Majority bought - return positive score (40-50 range for BUY)
      return 40 + Math.floor(buyRatio * 10); // 40-50 range
    } else if (sellRatio > 0.5) {
      // Majority sold - return negative score (-40 to -50 range for SELL)
      return -40 - Math.floor(sellRatio * 10); // -40 to -50 range
    } else {
      // Equal split - return HOLD (0)
      return 0;
    }
  }, []);

  /** Fetch ML recommendation from backend */
  const fetchRecommendation = useCallback(async (tickerParam: string): Promise<number> => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/GRURegressor?symbol=${tickerParam}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      if (!data.recommendation || typeof data.recommendation !== 'string') {
        throw new Error("Invalid recommendation response from server");
      }
      
      const recommendationText = data.recommendation;
      setRecommendation(recommendationText);
      
      // Convert recommendation to score
      const upperText = recommendationText.toUpperCase();
      if (upperText === "BUY") return 50;
      if (upperText === "SELL") return -50;
      if (upperText === "HOLD") return 0;
      throw new Error(`Invalid recommendation value: ${recommendationText}`);
    } catch (error) {
      console.error("Error fetching recommendation:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to fetch recommendation";
      setRecommendation(`Error: ${errorMessage}`);
      throw error;
    }
  }, []);

  /** Run full AI analysis */
  const runAnalysis = useCallback(async () => {
    setAnalysis({
      isAnalyzing: true,
      currentStep: 0,
      completedSteps: [],
      result: null,
    });

    // Simulate analysis steps
    for (let i = 0; i < ANALYSIS_STEPS.length; i++) {
      setAnalysis((prev) => ({ ...prev, currentStep: i }));
      await new Promise((resolve) => setTimeout(resolve, ANALYSIS_STEPS[i].duration));
      setAnalysis((prev) => ({
        ...prev,
        completedSteps: [...prev.completedSteps, i],
      }));
    }

    // Generate scores
    const generateScore = () => Math.floor(Math.random() * 200) - 100;
    const getRecommendation = (score: number): "buy" | "sell" | "hold" => {
      if (score > 30) return "buy";
      if (score < -30) return "sell";
      return "hold";
    };

    // Get ML score
    let mlScore: number;
    try {
      mlScore = await fetchRecommendation(ticker);
    } catch (error) {
      setAnalysis({
        isAnalyzing: false,
        currentStep: 0,
        completedSteps: [],
        result: null,
      });
      const errorMessage = error instanceof Error ? error.message : "ML model prediction failed";
      setRecommendation(`Error: ${errorMessage}`);
      throw error;
    }
    
    const newsScore = generateScore();
    // Analyze Congress data to get actual buy/sell/hold rating
    const congressScore = analyzeCongressData(congressData);
    const socialScore = generateScore();

    const sources = {
      "ml-model": { recommendation: getRecommendation(mlScore), score: mlScore },
      "news-outlets": { recommendation: getRecommendation(newsScore), score: newsScore },
      congress: { recommendation: getRecommendation(congressScore), score: congressScore },
      "social-media": { recommendation: getRecommendation(socialScore), score: socialScore },
    };

    // Calculate weighted score
    const totalWeight = Object.values(sourceWeights).reduce((a, b) => a + b, 0) || 100;
    const weightedScore = 
      (mlScore * sourceWeights["ml-model"] +
       newsScore * sourceWeights["news-outlets"] +
       congressScore * sourceWeights["congress"] +
       socialScore * sourceWeights["social-media"]) / totalWeight;

    setAnalysis((prev) => ({
      ...prev,
      isAnalyzing: false,
      result: {
        overall: Math.round(weightedScore),
        sources,
      },
    }));

    setActiveTab("ai-analysis");
  }, [sourceWeights, ticker, fetchRecommendation, analyzeCongressData, congressData]);

  /** Reset analysis state */
  const resetAnalysis = useCallback(() => {
    setAnalysis({
      isAnalyzing: false,
      currentStep: 0,
      completedSteps: [],
      result: null,
    });
  }, []);

  // ---------------------------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-background">
      {/* ===================================================================
          SECTION 1: NAVIGATION BAR
          =================================================================== */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="relative border-[#333] text-[#333] bg-transparent overflow-hidden group whitespace-nowrap shrink-0 focus:outline-none flex items-center gap-2"
            >
              <span className="relative z-10 text-[#333] group-hover:text-white transition-colors duration-300 delay-150">
                <ArrowLeft className="size-5 inline mr-2" />
                Back to Dashboard
              </span>
              <div className="absolute inset-0 bg-[#333] z-0 scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
            </Button>
          </div>
        </div>
      </div>

      {/* ===================================================================
          SECTION 2: MAIN CONTENT
          =================================================================== */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Loading State */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
            <Loader2 className="size-10 animate-spin text-muted-foreground" />
            <span className="text-muted-foreground">Loading stock details...</span>
          </div>
        ) : isError ? (
          /* Error State */
          <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
            <span className="text-destructive text-lg">Failed to load stock details</span>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        ) : stock ? (
          <div className="space-y-8">
            {/* =============================================================
                SECTION 2.1: STOCK HEADER
                ============================================================= */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6"
            >
              {/* Stock Logo & Name */}
              <div className="flex items-start gap-5">
                {stock.profile?.logo ? (
                  <img
                    src={stock.profile.logo}
                    alt={ticker}
                    className="size-20 rounded-2xl object-contain bg-white shadow-lg"
                  />
                ) : (
                  <div className="size-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shadow-lg">
                    <span className="text-2xl font-bold text-primary">
                      {ticker.slice(0, 2)}
                    </span>
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h1 className="text-3xl font-bold text-foreground">
                      {stock.profile?.name || ticker}
                    </h1>
                    {stock.profile?.exchange && (
                      <span className="text-xs px-3 py-1 rounded-full bg-muted text-muted-foreground font-medium">
                        {stock.profile.exchange}
                      </span>
                    )}
                  </div>
                  <p className="text-lg text-muted-foreground">{ticker}</p>
                  {stock.profile?.finnhubIndustry && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {stock.profile.finnhubIndustry}
                    </p>
                  )}
                </div>
              </div>

              {/* Stock Price & Change */}
              <div className="flex flex-col items-start lg:items-end gap-1">
                <span className="text-4xl font-bold font-mono">
                  {formatPrice(stock.quote?.c ?? 0)}
                </span>
                <div className="flex items-center gap-3">
                  <span
                    className={`flex items-center gap-1.5 text-xl font-semibold ${
                      isPositive ? "text-emerald-500" : "text-red-500"
                    }`}
                  >
                    {isPositive ? (
                      <TrendingUp className="size-5" />
                    ) : (
                      <TrendingDown className="size-5" />
                    )}
                    {formatChange(stock.quote?.dp ?? 0)}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {isPositive ? "+" : ""}
                    {formatPrice(stock.quote?.d ?? 0)} Today
                  </span>
                </div>
              </div>
            </motion.div>

            {/* =============================================================
                SECTION 2.2: TAB NAVIGATION
                ============================================================= */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="border-b border-border"
            >
              <div className="flex gap-1">
                {TABS.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => handleTabChange(tab.id)}
                      className={`relative flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors cursor-pointer ${
                        isActive
                          ? "text-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Icon className="size-4" />
                      {tab.label}
                      {isActive && (
                        <motion.div
                          layoutId="activeTab"
                          className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </motion.div>

            {/* =============================================================
                SECTION 2.3: TAB CONTENT
                ============================================================= */}
            <AnimatePresence mode="wait">
              {activeTab === "stock-info" && (
                <StockInfoTab
                  key="stock-info"
                  stock={stock}
                  ticker={ticker}
                  candleData={candleData}
                  candlesLoading={candlesLoading}
                  chartPriceChange={chartPriceChange}
                  selectedRange={selectedRange}
                  setSelectedRange={setSelectedRange}
                  financials={financials}
                  isMetricsExpanded={isMetricsExpanded}
                  setIsMetricsExpanded={setIsMetricsExpanded}
                  isCompanyInfoExpanded={isCompanyInfoExpanded}
                  setIsCompanyInfoExpanded={setIsCompanyInfoExpanded}
                  analysis={analysis}
                  runAnalysis={runAnalysis}
                  resetAnalysis={resetAnalysis}
                  isPositive={isPositive}
                />
              )}

              {activeTab === "insider-knowledge" && (
                <InsiderKnowledgeTab
                  key="insider-knowledge"
                  congressData={congressData}
                  isLoading={isCongressLoading}
                  ticker={ticker}
                />
              )}

              {activeTab === "ai-analysis" && (
                <AIAnalysisTab
                  key="ai-analysis"
                  analysis={analysis}
                  sourceWeights={sourceWeights}
                  runAnalysis={runAnalysis}
                  resetAnalysis={resetAnalysis}
                  ticker={ticker}
                />
              )}
            </AnimatePresence>
          </div>
        ) : null}
      </main>

      {/* Floating AI Chat */}
      {stock && <AskAIChat stockContext={stockContext} />}
    </div>
  );
}
