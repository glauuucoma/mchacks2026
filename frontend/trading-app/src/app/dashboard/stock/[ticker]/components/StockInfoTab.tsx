/**
 * StockInfoTab Component
 * 
 * Main tab displaying comprehensive stock information including price chart,
 * market data, financial metrics, and company information.
 * 
 * LAYOUT:
 * -------
 * Two-column grid (3 cols on lg screens):
 * - Left (2 cols): Summary, Chart, Market Data, Metrics, Company Info
 * - Right (1 col): AI Analysis Sidebar
 * 
 * SECTIONS:
 * ---------
 * 1. SummarySection - Company overview with AI chat button
 * 2. PriceChartSection - Interactive price chart with time range selector
 * 3. MarketDataSection - Current price, open, high, low, etc.
 * 4. FinancialMetricsSection - P/E, EPS, 52-week range, etc. (expandable)
 * 5. CompanyInfoSection - Industry, country, exchange, etc. (expandable)
 * 6. AIAnalysisSidebar - Analysis trigger and progress display
 */

"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
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
  LineChart,
  Target,
  Percent,
  Scale,
  PiggyBank,
  ChartCandlestick,
  ChevronDown,
  Newspaper,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TimeRange } from "@/lib/stocks-api";
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
import { DataCell } from "./DataCell";
import { ANALYSIS_STEPS, TIME_RANGES, type AnalysisState } from "../data";
import { useNewsHeadlines, type Article } from "@/lib/api/news";

// =============================================================================
// TYPES
// =============================================================================

interface StockInfoTabProps {
  stock: any;
  ticker: string;
  stockContext: any;
  candleData: any;
  candlesLoading: boolean;
  chartPriceChange: { change: number; changePercent: number; isPositive: boolean } | null;
  selectedRange: TimeRange;
  setSelectedRange: (range: TimeRange) => void;
  financials: any;
  isMetricsExpanded: boolean;
  setIsMetricsExpanded: (expanded: boolean) => void;
  isCompanyInfoExpanded: boolean;
  setIsCompanyInfoExpanded: (expanded: boolean) => void;
  analysis: AnalysisState;
  runAnalysis: () => void;
  resetAnalysis: () => void;
  isPositive: boolean;
}

// =============================================================================
// SECTION 1: SUMMARY
// =============================================================================

function SummarySection({
  stock,
  ticker,
  stockContext,
  isPositive,
}: {
  stock: any;
  ticker: string;
  stockContext: any;
  isPositive: boolean;
}) {
  return (
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
        is a {stock.profile?.finnhubIndustry || "publicly traded"} company
        {stock.profile?.country &&
          ` headquartered in ${stock.profile.country}`}
        .
        {stock.profile?.marketCapitalization && (
          <>
            {" "}
            With a market capitalization of{" "}
            <span className="font-medium text-foreground">
              {formatMarketCap(stock.profile.marketCapitalization * 1000000)}
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
              className={isPositive ? "text-emerald-500" : "text-red-500"}
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
  );
}

// =============================================================================
// SECTION 2: NEWS ARTICLES
// =============================================================================

function NewsSection({ companyName }: { companyName: string }) {
  const searchQuery = `${companyName}`;
  const { data: articles, isLoading, isError } = useNewsHeadlines(searchQuery, true, 3);

  if (isError || (!isLoading && (!articles || articles.length === 0))) {
    return null; // Don't show section if there's an error or no articles
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.125 }}
      className="bg-card rounded-2xl border border-border p-6"
    >
      <div className="flex items-center gap-2 mb-4">
        <Newspaper className="size-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Latest News</h3>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {articles?.slice(0, 6).map((article: Article, index: number) => (
            <motion.a
              key={article.url || index}
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className="group inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-muted/30 hover:bg-muted/50 hover:border-primary/30 hover:text-primary transition-all duration-200 text-sm font-medium text-foreground"
            >
              <span>{article.title}</span>
              <ExternalLink className="size-3.5 text-muted-foreground group-hover:text-primary transition-colors shrink-0 opacity-0 group-hover:opacity-100" />
            </motion.a>
          ))}
        </div>
      )}
    </motion.section>
  );
}

// =============================================================================
// SECTION 3: PRICE CHART
// =============================================================================

function PriceChartSection({
  candleData,
  candlesLoading,
  chartPriceChange,
  selectedRange,
  setSelectedRange,
}: {
  candleData: any;
  candlesLoading: boolean;
  chartPriceChange: { change: number; changePercent: number; isPositive: boolean } | null;
  selectedRange: TimeRange;
  setSelectedRange: (range: TimeRange) => void;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="bg-card rounded-2xl border border-border overflow-hidden"
    >
      {/* Chart Header */}
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
                <span className="text-xs opacity-70">({selectedRange})</span>
              </div>
            )}
          </div>
          
          {/* Time Range Selector */}
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

      {/* Chart Body */}
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
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor={chartPriceChange?.isPositive !== false ? "#22c55e" : "#ef4444"}
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor={chartPriceChange?.isPositive !== false ? "#22c55e" : "#ef4444"}
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
                formatter={(value) => [formatPrice(Number(value) || 0), "Price"]}
              />
              <Area
                type="monotone"
                dataKey="close"
                stroke={chartPriceChange?.isPositive !== false ? "#22c55e" : "#ef4444"}
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
  );
}

// =============================================================================
// SECTION 3: MARKET DATA
// =============================================================================

function MarketDataSection({ stock }: { stock: any }) {
  return (
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
          value={formatMarketCap((stock.profile?.marketCapitalization ?? 0) * 1000000)}
        />
      </div>
    </motion.section>
  );
}

// =============================================================================
// SECTION 4: FINANCIAL METRICS (Expandable)
// =============================================================================

function FinancialMetricsSection({
  financials,
  isExpanded,
  setIsExpanded,
}: {
  financials: any;
  isExpanded: boolean;
  setIsExpanded: (expanded: boolean) => void;
}) {
  if (!financials?.metric) return null;

  const metric = financials.metric;

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
      className="bg-card rounded-2xl border border-border overflow-hidden"
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-6 border-b border-border flex items-center justify-between hover:bg-muted/50 transition-colors"
      >
        <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Target className="size-4 text-primary" />
          Key Metrics & Ratios
        </h3>
        <ChevronDown
          className={`size-5 text-muted-foreground transition-transform ${
            isExpanded ? "transform rotate-180" : ""
          }`}
        />
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-2 md:grid-cols-3 divide-x divide-y divide-border">
              {(metric.peBasicExclExtraTTM || metric.peTTM) && (
                <DataCell
                  icon={<Scale className="size-4" />}
                  label="P/E Ratio (TTM)"
                  value={(metric.peBasicExclExtraTTM || metric.peTTM || 0).toFixed(2)}
                />
              )}
              {(metric.epsBasicExclExtraItemsTTM || metric.epsTTM) && (
                <DataCell
                  icon={<DollarSign className="size-4" />}
                  label="EPS (TTM)"
                  value={`$${(metric.epsBasicExclExtraItemsTTM || metric.epsTTM || 0).toFixed(2)}`}
                />
              )}
              {metric["52WeekHigh"] && (
                <DataCell
                  icon={<TrendingUp className="size-4" />}
                  label="52-Week High"
                  value={formatPrice(metric["52WeekHigh"])}
                  valueClass="text-emerald-500"
                />
              )}
              {metric["52WeekLow"] && (
                <DataCell
                  icon={<TrendingDown className="size-4" />}
                  label="52-Week Low"
                  value={formatPrice(metric["52WeekLow"])}
                  valueClass="text-red-500"
                />
              )}
              {metric.beta !== undefined && (
                <DataCell
                  icon={<Activity className="size-4" />}
                  label="Beta"
                  value={metric.beta.toFixed(2)}
                />
              )}
              {metric.dividendYieldIndicatedAnnual !== undefined && (
                <DataCell
                  icon={<PiggyBank className="size-4" />}
                  label="Dividend Yield"
                  value={`${metric.dividendYieldIndicatedAnnual.toFixed(2)}%`}
                />
              )}
              {metric.pbAnnual && (
                <DataCell
                  icon={<BarChart3 className="size-4" />}
                  label="P/B Ratio"
                  value={metric.pbAnnual.toFixed(2)}
                />
              )}
              {metric.psAnnual && (
                <DataCell
                  icon={<Percent className="size-4" />}
                  label="P/S Ratio"
                  value={metric.psAnnual.toFixed(2)}
                />
              )}
              {metric.roeRfy !== undefined && (
                <DataCell
                  icon={<TrendingUp className="size-4" />}
                  label="ROE"
                  value={`${metric.roeRfy.toFixed(2)}%`}
                />
              )}
              {metric.roaRfy !== undefined && (
                <DataCell
                  icon={<Activity className="size-4" />}
                  label="ROA"
                  value={`${metric.roaRfy.toFixed(2)}%`}
                />
              )}
              {metric.grossMarginTTM !== undefined && (
                <DataCell
                  icon={<Percent className="size-4" />}
                  label="Gross Margin"
                  value={`${metric.grossMarginTTM.toFixed(1)}%`}
                />
              )}
              {metric.netProfitMarginTTM !== undefined && (
                <DataCell
                  icon={<DollarSign className="size-4" />}
                  label="Net Margin"
                  value={`${metric.netProfitMarginTTM.toFixed(1)}%`}
                />
              )}
              {metric.debtEquityAnnual !== undefined && (
                <DataCell
                  icon={<Scale className="size-4" />}
                  label="Debt/Equity"
                  value={metric.debtEquityAnnual.toFixed(2)}
                />
              )}
              {metric.currentRatioAnnual !== undefined && (
                <DataCell
                  icon={<BarChart3 className="size-4" />}
                  label="Current Ratio"
                  value={metric.currentRatioAnnual.toFixed(2)}
                />
              )}
              {metric.revenueGrowthTTMYoy !== undefined && (
                <DataCell
                  icon={<TrendingUp className="size-4" />}
                  label="Revenue Growth (YoY)"
                  value={`${metric.revenueGrowthTTMYoy.toFixed(1)}%`}
                  valueClass={metric.revenueGrowthTTMYoy >= 0 ? "text-emerald-500" : "text-red-500"}
                />
              )}
              {metric.epsGrowthTTMYoy !== undefined && (
                <DataCell
                  icon={<TrendingUp className="size-4" />}
                  label="EPS Growth (YoY)"
                  value={`${metric.epsGrowthTTMYoy.toFixed(1)}%`}
                  valueClass={metric.epsGrowthTTMYoy >= 0 ? "text-emerald-500" : "text-red-500"}
                />
              )}
              {metric["10DayAverageTradingVolume"] !== undefined && (
                <DataCell
                  icon={<BarChart3 className="size-4" />}
                  label="Avg Volume (10D)"
                  value={formatVolume(metric["10DayAverageTradingVolume"] * 1000000)}
                />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}

// =============================================================================
// SECTION 5: COMPANY INFO (Expandable)
// =============================================================================

function CompanyInfoSection({
  stock,
  isExpanded,
  setIsExpanded,
}: {
  stock: any;
  isExpanded: boolean;
  setIsExpanded: (expanded: boolean) => void;
}) {
  if (!stock.profile) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="bg-card rounded-2xl border border-border overflow-hidden"
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-6 border-b border-border flex items-center justify-between hover:bg-muted/50 transition-colors"
      >
        <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Building2 className="size-4 text-primary" />
          Company Information
        </h3>
        <ChevronDown
          className={`size-5 text-muted-foreground transition-transform ${
            isExpanded ? "transform rotate-180" : ""
          }`}
        />
      </button>

      <AnimatePresence>
        {isExpanded && (
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
                  value={formatVolume(stock.profile.shareOutstanding * 1000000)}
                />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}

// =============================================================================
// SECTION 6: AI ANALYSIS SIDEBAR
// =============================================================================

function AIAnalysisSidebar({
  ticker,
  analysis,
  runAnalysis,
  resetAnalysis,
}: {
  ticker: string;
  analysis: AnalysisState;
  runAnalysis: () => void;
  resetAnalysis: () => void;
}) {
  return (
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

      {/* Initial State - No Analysis */}
      {!analysis.isAnalyzing && !analysis.result && (
        <div className="text-center py-6">
          <div className="size-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <Sparkles className="size-8 text-primary" />
          </div>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto mb-6">
            Run a comprehensive AI analysis on{" "}
            <span className="font-medium text-foreground">{ticker}</span> to get insights
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

      {/* Analysis In Progress or Complete */}
      {(analysis.isAnalyzing || analysis.result) && (
        <div className="space-y-3">
          {ANALYSIS_STEPS.map((step, index) => {
            const isCompleted = analysis.completedSteps.includes(index);
            const isCurrent = analysis.currentStep === index && analysis.isAnalyzing;

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

          {/* Analysis Complete Card */}
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
                      AI Analysis Complete
                    </p>
                    <p className="text-lg font-bold text-emerald-500">
                      View Results →
                    </p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Analysis complete! Check the AI Analysis tab for detailed results.
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
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function StockInfoTab({
  stock,
  ticker,
  stockContext,
  candleData,
  candlesLoading,
  chartPriceChange,
  selectedRange,
  setSelectedRange,
  financials,
  isMetricsExpanded,
  setIsMetricsExpanded,
  isCompanyInfoExpanded,
  setIsCompanyInfoExpanded,
  analysis,
  runAnalysis,
  resetAnalysis,
  isPositive,
}: StockInfoTabProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="grid grid-cols-1 lg:grid-cols-3 gap-6"
    >
      {/* Left Column - Main Content (2 cols) */}
      <div className="lg:col-span-2 space-y-6">
        <SummarySection
          stock={stock}
          ticker={ticker}
          stockContext={stockContext}
          isPositive={isPositive}
        />

        <NewsSection companyName={stock?.profile?.name || ticker} />

        <PriceChartSection
          candleData={candleData}
          candlesLoading={candlesLoading}
          chartPriceChange={chartPriceChange}
          selectedRange={selectedRange}
          setSelectedRange={setSelectedRange}
        />

        <MarketDataSection stock={stock} />

        <FinancialMetricsSection
          financials={financials}
          isExpanded={isMetricsExpanded}
          setIsExpanded={setIsMetricsExpanded}
        />

        <CompanyInfoSection
          stock={stock}
          isExpanded={isCompanyInfoExpanded}
          setIsExpanded={setIsCompanyInfoExpanded}
        />
      </div>

      {/* Right Column - AI Analysis Sidebar (1 col) */}
      <div className="space-y-6">
        <AIAnalysisSidebar
          ticker={ticker}
          analysis={analysis}
          runAnalysis={runAnalysis}
          resetAnalysis={resetAnalysis}
        />
      </div>
    </motion.div>
  );
}
