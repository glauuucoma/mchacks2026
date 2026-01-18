"use client";

import { useState, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Building2,
  Globe,
  Phone,
  Calendar,
  DollarSign,
  BarChart3,
  Activity,
  Sparkles,
  CheckCircle2,
  Loader2,
  ExternalLink,
  Layers,
  Share2,
  Bell,
  Star,
  LineChart,
  Target,
  Percent,
  Scale,
  PiggyBank,
  ChartCandlestick,
  ChevronDown,
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
  formatVolume,
  formatChange,
} from "@/components/dashboard/utils";
import AskAIChat from "@/components/dashboard/AskAIChat";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

// Analysis steps for the mock loading
const ANALYSIS_STEPS = [
  { id: 1, title: "Fetching historical price data", duration: 1200 },
  { id: 2, title: "Analyzing trading patterns", duration: 1500 },
  { id: 3, title: "Calculating technical indicators", duration: 1800 },
  { id: 4, title: "Running sentiment analysis", duration: 2000 },
  { id: 5, title: "Evaluating market conditions", duration: 1400 },
  { id: 6, title: "Generating AI predictions", duration: 2200 },
  { id: 7, title: "Compiling final report", duration: 1000 },
];

interface AnalysisState {
  isAnalyzing: boolean;
  currentStep: number;
  completedSteps: number[];
  result: string | null;
}

const TIME_RANGES: TimeRange[] = ["1D", "1W", "1M", "3M", "6M", "1Y", "5Y"];

export default function StockDetailPage() {
  const params = useParams();
  const router = useRouter();
  const ticker = (params.ticker as string)?.toUpperCase() || "";

  const { data: stock, isLoading, isError } = useStockDetail(ticker, true);
  const [selectedRange, setSelectedRange] = useState<TimeRange>("1M");
  const { data: candleData, isLoading: candlesLoading } = useStockCandles(
    ticker,
    selectedRange,
    !!ticker
  );
  const { data: financials } = useBasicFinancials(ticker, !!ticker);

  const [analysis, setAnalysis] = useState<AnalysisState>({
    isAnalyzing: false,
    currentStep: 0,
    completedSteps: [],
    result: null,
  });

  const [isMetricsExpanded, setIsMetricsExpanded] = useState(false);
  const [isCompanyInfoExpanded, setIsCompanyInfoExpanded] = useState(false);

  // Calculate price change from chart data
  const chartPriceChange = useMemo(() => {
    if (!candleData || candleData.length < 2) return null;
    const firstPrice = candleData[0].close;
    const lastPrice = candleData[candleData.length - 1].close;
    const change = lastPrice - firstPrice;
    const changePercent = (change / firstPrice) * 100;
    return { change, changePercent, isPositive: change >= 0 };
  }, [candleData]);

  const runAnalysis = useCallback(async () => {
    setAnalysis({
      isAnalyzing: true,
      currentStep: 0,
      completedSteps: [],
      result: null,
    });

    for (let i = 0; i < ANALYSIS_STEPS.length; i++) {
      setAnalysis((prev) => ({ ...prev, currentStep: i }));
      await new Promise((resolve) =>
        setTimeout(resolve, ANALYSIS_STEPS[i].duration)
      );
      setAnalysis((prev) => ({
        ...prev,
        completedSteps: [...prev.completedSteps, i],
      }));
    }

    const predictions = [
      "Bullish",
      "Moderately Bullish",
      "Neutral",
      "Moderately Bearish",
      "Bearish",
    ];
    const randomPrediction = predictions[Math.floor(Math.random() * 3)];

    setAnalysis((prev) => ({
      ...prev,
      isAnalyzing: false,
      result: randomPrediction,
    }));
  }, []);

  const resetAnalysis = useCallback(() => {
    setAnalysis({
      isAnalyzing: false,
      currentStep: 0,
      completedSteps: [],
      result: null,
    });
  }, []);

  const isPositive = (stock?.quote?.dp ?? 0) >= 0;

  // Stock context for AI chat
  const stockContext = {
    ticker,
    name: stock?.profile?.name || ticker,
    price: stock?.quote?.c || 0,
    change: stock?.quote?.dp || 0,
    marketCap: formatMarketCap(
      (stock?.profile?.marketCapitalization ?? 0) * 1000000
    ),
    industry: stock?.profile?.finnhubIndustry || "Unknown",
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Bar */}
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

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-2">
                <Bell className="size-4" />
                <span className="hidden sm:inline">Set Alert</span>
              </Button>
              <Button variant="outline" size="sm" className="gap-2">
                <Star className="size-4" />
                <span className="hidden sm:inline">Watchlist</span>
              </Button>
              <Button variant="outline" size="sm" className="gap-2">
                <Share2 className="size-4" />
                <span className="hidden sm:inline">Share</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
            <Loader2 className="size-10 animate-spin text-muted-foreground" />
            <span className="text-muted-foreground">
              Loading stock details...
            </span>
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
            <span className="text-destructive text-lg">
              Failed to load stock details
            </span>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        ) : stock ? (
          <div className="space-y-8">
            {/* Header Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6"
            >
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

            {/* Grid Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Summary & Company Info */}
              <div className="lg:col-span-2 space-y-6">
                {/* Summary Section */}
                <motion.section
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-card rounded-2xl border border-border p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      <Layers className="size-4 text-primary" />
                      Summary
                    </h3>
                    <div className="relative">
                      <AskAIChat stockContext={stockContext} />
                    </div>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    <span className="font-medium text-foreground">
                      {stock.profile?.name || ticker}
                    </span>{" "}
                    is a {stock.profile?.finnhubIndustry || "publicly traded"}{" "}
                    company
                    {stock.profile?.country &&
                      ` headquartered in ${stock.profile.country}`}
                    .
                    {stock.profile?.marketCapitalization && (
                      <>
                        {" "}
                        With a market capitalization of{" "}
                        <span className="font-medium text-foreground">
                          {formatMarketCap(
                            stock.profile.marketCapitalization * 1000000
                          )}
                        </span>
                        , it represents a{" "}
                        {stock.profile.marketCapitalization > 200000
                          ? "large-cap"
                          : stock.profile.marketCapitalization > 10000
                          ? "mid-cap"
                          : "small-cap"}{" "}
                        investment opportunity.
                      </>
                    )}
                    {stock.quote?.dp !== undefined && (
                      <>
                        {" "}
                        The stock is currently trading{" "}
                        <span
                          className={
                            isPositive ? "text-emerald-500" : "text-red-500"
                          }
                        >
                          {isPositive ? "up" : "down"}{" "}
                          {formatChange(Math.abs(stock.quote.dp))}
                        </span>{" "}
                        from the previous close.
                      </>
                    )}
                  </p>
                  {stock.profile?.weburl && (
                    <a
                      href={stock.profile.weburl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 mt-4 text-sm text-primary hover:underline"
                    >
                      Visit Company Website
                      <ExternalLink className="size-3.5" />
                    </a>
                  )}
                </motion.section>

                {/* Stock Chart Section */}
                <motion.section
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="bg-card rounded-2xl border border-border overflow-hidden"
                >
                  <div className="p-6 border-b border-border">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div className="flex items-center gap-3">
                        <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                          <LineChart className="size-4 text-primary" />
                          Price Chart
                        </h3>
                        {chartPriceChange && (
                          <div
                            className={`flex items-center gap-1.5 text-sm font-medium px-2.5 py-1 rounded-full ${
                              chartPriceChange.isPositive
                                ? "bg-emerald-500/10 text-emerald-500"
                                : "bg-red-500/10 text-red-500"
                            }`}
                          >
                            {chartPriceChange.isPositive ? (
                              <TrendingUp className="size-3.5" />
                            ) : (
                              <TrendingDown className="size-3.5" />
                            )}
                            {formatChange(chartPriceChange.changePercent)}
                            <span className="text-xs opacity-70">
                              ({selectedRange})
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
                        {TIME_RANGES.map((range) => (
                          <button
                            key={range}
                            onClick={() => setSelectedRange(range)}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                              selectedRange === range
                                ? "bg-primary text-primary-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted"
                            }`}
                          >
                            {range}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="p-6 h-[350px]">
                    {candlesLoading ? (
                      <div className="h-full flex items-center justify-center">
                        <Loader2 className="size-8 animate-spin text-muted-foreground" />
                      </div>
                    ) : candleData && candleData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={candleData}
                          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                        >
                          <defs>
                            <linearGradient
                              id="chartGradient"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="5%"
                                stopColor={
                                  chartPriceChange?.isPositive !== false
                                    ? "#22c55e"
                                    : "#ef4444"
                                }
                                stopOpacity={0.3}
                              />
                              <stop
                                offset="95%"
                                stopColor={
                                  chartPriceChange?.isPositive !== false
                                    ? "#22c55e"
                                    : "#ef4444"
                                }
                                stopOpacity={0}
                              />
                            </linearGradient>
                          </defs>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="hsl(var(--border))"
                            opacity={0.5}
                          />
                          <XAxis
                            dataKey="date"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                            interval="preserveStartEnd"
                            minTickGap={50}
                          />
                          <YAxis
                            domain={["auto", "auto"]}
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                            tickFormatter={(value) => `$${value.toFixed(0)}`}
                            width={60}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "white",
                              border: "1px solid hsl(var(--border))",
                              borderRadius: "12px",
                              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                            }}
                            labelStyle={{ color: "black", fontWeight: 600 }}
                            formatter={(value) => [
                              formatPrice(Number(value) || 0),
                              "Price",
                            ]}
                          />
                          <Area
                            type="monotone"
                            dataKey="close"
                            stroke={
                              chartPriceChange?.isPositive !== false
                                ? "#22c55e"
                                : "#ef4444"
                            }
                            strokeWidth={2}
                            fill="url(#chartGradient)"
                            animationDuration={800}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                        <ChartCandlestick className="size-12 mb-3 opacity-50" />
                        <p className="text-sm">No chart data available</p>
                        <p className="text-xs mt-1">Try a different time range</p>
                      </div>
                    )}
                  </div>
                </motion.section>

                {/* Market Data Section */}
                <motion.section
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-card rounded-2xl border border-border overflow-hidden"
                >
                  <div className="p-6 border-b border-border">
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      <BarChart3 className="size-4 text-primary" />
                      Market Data
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 divide-x divide-y divide-border">
                    <DataCell
                      icon={<DollarSign className="size-4" />}
                      label="Current Price"
                      value={formatPrice(stock.quote?.c ?? 0)}
                    />
                    <DataCell
                      icon={<Activity className="size-4" />}
                      label="Open"
                      value={formatPrice(stock.quote?.o ?? 0)}
                    />
                    <DataCell
                      icon={<TrendingUp className="size-4" />}
                      label="Day High"
                      value={formatPrice(stock.quote?.h ?? 0)}
                      valueClass="text-emerald-500"
                    />
                    <DataCell
                      icon={<TrendingDown className="size-4" />}
                      label="Day Low"
                      value={formatPrice(stock.quote?.l ?? 0)}
                      valueClass="text-red-500"
                    />
                    <DataCell
                      icon={<Calendar className="size-4" />}
                      label="Previous Close"
                      value={formatPrice(stock.quote?.pc ?? 0)}
                    />
                    <DataCell
                      icon={<Building2 className="size-4" />}
                      label="Market Cap"
                      value={formatMarketCap(
                        (stock.profile?.marketCapitalization ?? 0) * 1000000
                      )}
                    />
                  </div>
                </motion.section>

                {/* Financial Metrics Section */}
                {financials?.metric && (
                  <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    className="bg-card rounded-2xl border border-border overflow-hidden"
                  >
                    <button
                      onClick={() => setIsMetricsExpanded(!isMetricsExpanded)}
                      className="w-full p-6 border-b border-border flex items-center justify-between hover:bg-muted/50 transition-colors"
                    >
                      <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <Target className="size-4 text-primary" />
                        Key Metrics & Ratios
                      </h3>
                      <ChevronDown
                        className={`size-5 text-muted-foreground transition-transform ${
                          isMetricsExpanded ? "transform rotate-180" : ""
                        }`}
                      />
                    </button>

                    <AnimatePresence>
                      {isMetricsExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="grid grid-cols-2 md:grid-cols-3 divide-x divide-y divide-border">
                      {(financials.metric.peBasicExclExtraTTM ||
                        financials.metric.peTTM) && (
                        <DataCell
                          icon={<Scale className="size-4" />}
                          label="P/E Ratio (TTM)"
                          value={(
                            financials.metric.peBasicExclExtraTTM ||
                            financials.metric.peTTM ||
                            0
                          ).toFixed(2)}
                        />
                      )}
                      {(financials.metric.epsBasicExclExtraItemsTTM ||
                        financials.metric.epsTTM) && (
                        <DataCell
                          icon={<DollarSign className="size-4" />}
                          label="EPS (TTM)"
                          value={`$${(
                            financials.metric.epsBasicExclExtraItemsTTM ||
                            financials.metric.epsTTM ||
                            0
                          ).toFixed(2)}`}
                        />
                      )}
                      {financials.metric["52WeekHigh"] && (
                        <DataCell
                          icon={<TrendingUp className="size-4" />}
                          label="52-Week High"
                          value={formatPrice(financials.metric["52WeekHigh"])}
                          valueClass="text-emerald-500"
                        />
                      )}
                      {financials.metric["52WeekLow"] && (
                        <DataCell
                          icon={<TrendingDown className="size-4" />}
                          label="52-Week Low"
                          value={formatPrice(financials.metric["52WeekLow"])}
                          valueClass="text-red-500"
                        />
                      )}
                      {financials.metric.beta !== undefined && (
                        <DataCell
                          icon={<Activity className="size-4" />}
                          label="Beta"
                          value={financials.metric.beta.toFixed(2)}
                        />
                      )}
                      {financials.metric.dividendYieldIndicatedAnnual !== undefined && (
                        <DataCell
                          icon={<PiggyBank className="size-4" />}
                          label="Dividend Yield"
                          value={`${financials.metric.dividendYieldIndicatedAnnual.toFixed(2)}%`}
                        />
                      )}
                      {financials.metric.pbAnnual && (
                        <DataCell
                          icon={<BarChart3 className="size-4" />}
                          label="P/B Ratio"
                          value={financials.metric.pbAnnual.toFixed(2)}
                        />
                      )}
                      {financials.metric.psAnnual && (
                        <DataCell
                          icon={<Percent className="size-4" />}
                          label="P/S Ratio"
                          value={financials.metric.psAnnual.toFixed(2)}
                        />
                      )}
                      {financials.metric.roeRfy !== undefined && (
                        <DataCell
                          icon={<TrendingUp className="size-4" />}
                          label="ROE"
                          value={`${financials.metric.roeRfy.toFixed(2)}%`}
                        />
                      )}
                      {financials.metric.roaRfy !== undefined && (
                        <DataCell
                          icon={<Activity className="size-4" />}
                          label="ROA"
                          value={`${financials.metric.roaRfy.toFixed(2)}%`}
                        />
                      )}
                      {financials.metric.grossMarginTTM !== undefined && (
                        <DataCell
                          icon={<Percent className="size-4" />}
                          label="Gross Margin"
                          value={`${financials.metric.grossMarginTTM.toFixed(1)}%`}
                        />
                      )}
                      {financials.metric.netProfitMarginTTM !== undefined && (
                        <DataCell
                          icon={<DollarSign className="size-4" />}
                          label="Net Margin"
                          value={`${financials.metric.netProfitMarginTTM.toFixed(1)}%`}
                        />
                      )}
                      {financials.metric.debtEquityAnnual !== undefined && (
                        <DataCell
                          icon={<Scale className="size-4" />}
                          label="Debt/Equity"
                          value={financials.metric.debtEquityAnnual.toFixed(2)}
                        />
                      )}
                      {financials.metric.currentRatioAnnual !== undefined && (
                        <DataCell
                          icon={<BarChart3 className="size-4" />}
                          label="Current Ratio"
                          value={financials.metric.currentRatioAnnual.toFixed(2)}
                        />
                      )}
                      {financials.metric.revenueGrowthTTMYoy !== undefined && (
                        <DataCell
                          icon={<TrendingUp className="size-4" />}
                          label="Revenue Growth (YoY)"
                          value={`${financials.metric.revenueGrowthTTMYoy.toFixed(1)}%`}
                          valueClass={
                            financials.metric.revenueGrowthTTMYoy >= 0
                              ? "text-emerald-500"
                              : "text-red-500"
                          }
                        />
                      )}
                      {financials.metric.epsGrowthTTMYoy !== undefined && (
                        <DataCell
                          icon={<TrendingUp className="size-4" />}
                          label="EPS Growth (YoY)"
                          value={`${financials.metric.epsGrowthTTMYoy.toFixed(1)}%`}
                          valueClass={
                            financials.metric.epsGrowthTTMYoy >= 0
                              ? "text-emerald-500"
                              : "text-red-500"
                          }
                        />
                      )}
                      {financials.metric["10DayAverageTradingVolume"] !== undefined && (
                        <DataCell
                          icon={<BarChart3 className="size-4" />}
                          label="Avg Volume (10D)"
                          value={formatVolume(
                            financials.metric["10DayAverageTradingVolume"] * 1000000
                          )}
                        />
                      )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.section>
                )}

                {/* Company Info Section */}
                {stock.profile && (
                  <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-card rounded-2xl border border-border overflow-hidden"
                  >
                    <button
                      onClick={() => setIsCompanyInfoExpanded(!isCompanyInfoExpanded)}
                      className="w-full p-6 border-b border-border flex items-center justify-between hover:bg-muted/50 transition-colors"
                    >
                      <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <Building2 className="size-4 text-primary" />
                        Company Information
                      </h3>
                      <ChevronDown
                        className={`size-5 text-muted-foreground transition-transform ${
                          isCompanyInfoExpanded ? "transform rotate-180" : ""
                        }`}
                      />
                    </button>

                    <AnimatePresence>
                      {isCompanyInfoExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="grid grid-cols-2 md:grid-cols-3 divide-x divide-y divide-border">
                      {stock.profile.finnhubIndustry && (
                        <DataCell
                          icon={<Layers className="size-4" />}
                          label="Industry"
                          value={stock.profile.finnhubIndustry}
                        />
                      )}
                      {stock.profile.country && (
                        <DataCell
                          icon={<Globe className="size-4" />}
                          label="Country"
                          value={stock.profile.country}
                        />
                      )}
                      {stock.profile.exchange && (
                        <DataCell
                          icon={<Building2 className="size-4" />}
                          label="Exchange"
                          value={stock.profile.exchange}
                        />
                      )}
                      {stock.profile.ipo && (
                        <DataCell
                          icon={<Calendar className="size-4" />}
                          label="IPO Date"
                          value={stock.profile.ipo}
                        />
                      )}
                      {stock.profile.phone && (
                        <DataCell
                          icon={<Phone className="size-4" />}
                          label="Phone"
                          value={stock.profile.phone}
                        />
                      )}
                      {stock.profile.shareOutstanding && (
                        <DataCell
                          icon={<BarChart3 className="size-4" />}
                          label="Shares Outstanding"
                          value={formatVolume(
                            stock.profile.shareOutstanding * 1000000
                          )}
                        />
                      )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.section>
                )}
              </div>

              {/* Right Column - AI Analysis */}
              <div className="space-y-6">
                <motion.section
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="bg-gradient-to-br from-primary/5 via-card to-card rounded-2xl border border-border p-6 sticky top-24"
                >
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <Sparkles className="size-4 text-primary" />
                        AI Analysis
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        Run advanced AI-powered stock analysis
                      </p>
                    </div>
                  </div>

                  {!analysis.isAnalyzing && !analysis.result && (
                    <div className="text-center py-6">
                      <div className="size-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                        <Sparkles className="size-8 text-primary" />
                      </div>
                      <p className="text-sm text-muted-foreground max-w-xs mx-auto mb-6">
                        Run a comprehensive AI analysis on{" "}
                        <span className="font-medium text-foreground">
                          {ticker}
                        </span>{" "}
                        to get insights
                      </p>
                      <Button
                        onClick={runAnalysis}
                        className="gap-2 w-full bg-primary hover:bg-primary/90"
                        size="lg"
                      >
                        <Sparkles className="size-4" />
                        Start Analysis
                      </Button>
                    </div>
                  )}

                  {(analysis.isAnalyzing || analysis.result) && (
                    <div className="space-y-3">
                      {ANALYSIS_STEPS.map((step, index) => {
                        const isCompleted =
                          analysis.completedSteps.includes(index);
                        const isCurrent =
                          analysis.currentStep === index && analysis.isAnalyzing;

                        return (
                          <motion.div
                            key={step.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                              isCompleted
                                ? "bg-emerald-500/10"
                                : isCurrent
                                ? "bg-primary/10"
                                : "bg-muted/30"
                            }`}
                          >
                            <div className="shrink-0">
                              {isCompleted ? (
                                <CheckCircle2 className="size-4 text-emerald-500" />
                              ) : isCurrent ? (
                                <Loader2 className="size-4 text-primary animate-spin" />
                              ) : (
                                <div className="size-4 rounded-full border-2 border-muted-foreground/30" />
                              )}
                            </div>
                            <span
                              className={`text-xs ${
                                isCompleted
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : isCurrent
                                  ? "text-foreground font-medium"
                                  : "text-muted-foreground"
                              }`}
                            >
                              {step.title}
                            </span>
                            {isCurrent && (
                              <motion.div
                                className="ml-auto flex gap-1"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                              >
                                {[0, 1, 2].map((i) => (
                                  <motion.div
                                    key={i}
                                    className="size-1 rounded-full bg-primary"
                                    animate={{ opacity: [0.3, 1, 0.3] }}
                                    transition={{
                                      duration: 1,
                                      repeat: Infinity,
                                      delay: i * 0.2,
                                    }}
                                  />
                                ))}
                              </motion.div>
                            )}
                          </motion.div>
                        );
                      })}

                      <AnimatePresence>
                        {analysis.result && (
                          <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="mt-6 p-5 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/20"
                          >
                            <div className="flex items-center gap-3 mb-3">
                              <div className="size-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                <Sparkles className="size-5 text-emerald-500" />
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                                  AI Prediction
                                </p>
                                <p className="text-lg font-bold text-emerald-500">
                                  {analysis.result}
                                </p>
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Based on technical analysis, market sentiment, and
                              historical patterns, our AI model predicts a{" "}
                              <span className="font-medium text-foreground lowercase">
                                {analysis.result}
                              </span>{" "}
                              outlook for {ticker} over the next 30 days.
                            </p>
                            <div className="mt-4 pt-4 border-t border-emerald-500/20">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={resetAnalysis}
                                className="w-full"
                              >
                                Run Analysis Again
                              </Button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </motion.section>
              </div>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}

// Helper Components
function DataCell({
  icon,
  label,
  value,
  valueClass = "",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="p-5">
      <div className="flex items-center gap-2 text-muted-foreground mb-2">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <span className={`font-mono font-semibold text-lg ${valueClass}`}>
        {value}
      </span>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
      <div className="flex items-center gap-2 text-muted-foreground">
        <span className="size-4">{icon}</span>
        <span className="text-sm">{label}</span>
      </div>
      <span className="text-sm font-medium text-foreground">{value}</span>
    </div>
  );
}
