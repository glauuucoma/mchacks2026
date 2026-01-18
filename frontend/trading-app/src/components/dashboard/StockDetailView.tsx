"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
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
  ChevronRight,
  ExternalLink,
  Layers,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStockDetail } from "@/lib/stocks-api";
import { formatPrice, formatMarketCap, formatVolume, formatChange } from "./utils";

interface StockDetailViewProps {
  ticker: string;
  isOpen: boolean;
  onClose: () => void;
}

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

export default function StockDetailModal({
  ticker,
  isOpen,
  onClose,
}: StockDetailViewProps) {
  const { data: stock, isLoading, isError } = useStockDetail(ticker, isOpen);
  
  const [analysis, setAnalysis] = useState<AnalysisState>({
    isAnalyzing: false,
    currentStep: 0,
    completedSteps: [],
    result: null,
  });

  const [isCompanyInfoExpanded, setIsCompanyInfoExpanded] = useState(false);

  const runAnalysis = useCallback(async () => {
    setAnalysis({
      isAnalyzing: true,
      currentStep: 0,
      completedSteps: [],
      result: null,
    });

    for (let i = 0; i < ANALYSIS_STEPS.length; i++) {
      setAnalysis((prev) => ({ ...prev, currentStep: i }));
      await new Promise((resolve) => setTimeout(resolve, ANALYSIS_STEPS[i].duration));
      setAnalysis((prev) => ({
        ...prev,
        completedSteps: [...prev.completedSteps, i],
      }));
    }

    // Fake result
    const predictions = ["Bullish", "Moderately Bullish", "Neutral", "Moderately Bearish", "Bearish"];
    const randomPrediction = predictions[Math.floor(Math.random() * 3)]; // Bias towards positive
    
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

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
          />

          {/* Modal Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full max-w-2xl bg-background border-l border-border shadow-2xl z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border z-10">
              <div className="flex items-center justify-between p-6">
                <div className="flex items-center gap-4">
                  {stock?.profile?.logo ? (
                    <img
                      src={stock.profile.logo}
                      alt={ticker}
                      className="size-12 rounded-xl object-contain bg-white shadow-sm"
                    />
                  ) : (
                    <div className="size-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                      <span className="text-lg font-bold text-primary">
                        {ticker.slice(0, 2)}
                      </span>
                    </div>
                  )}
                  <div>
                    <h2 className="text-xl font-bold text-foreground">
                      {stock?.profile?.name || ticker}
                    </h2>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-sm text-muted-foreground">{ticker}</span>
                      {stock?.profile?.exchange && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                          {stock.profile.exchange}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-xl hover:bg-muted transition-colors"
                >
                  <X className="size-5" />
                </button>
              </div>

              {/* Price Banner */}
              {!isLoading && stock && (
                <div className="px-6 pb-4 flex items-baseline gap-4">
                  <span className="text-3xl font-bold font-mono">
                    {formatPrice(stock.quote?.c ?? 0)}
                  </span>
                  <span
                    className={`flex items-center gap-1 text-lg font-semibold ${
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
                    Today
                  </span>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="h-[calc(100%-180px)] overflow-y-auto">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center h-64 gap-4">
                  <Loader2 className="size-8 animate-spin text-muted-foreground" />
                  <span className="text-muted-foreground">Loading stock details...</span>
                </div>
              ) : isError ? (
                <div className="flex flex-col items-center justify-center h-64 gap-4">
                  <span className="text-destructive">Failed to load stock details</span>
                  <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                    Try Again
                  </Button>
                </div>
              ) : stock ? (
                <div className="p-6 space-y-6">
                  {/* Summary Section */}
                  <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-card rounded-2xl border border-border p-6"
                  >
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground mb-4">
                      <Layers className="size-4 text-primary" />
                      Summary
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      <span className="font-medium text-foreground">{stock.profile?.name || ticker}</span> is a{" "}
                      {stock.profile?.finnhubIndustry || "publicly traded"} company
                      {stock.profile?.country && ` headquartered in ${stock.profile.country}`}.
                      {stock.profile?.marketCapitalization && (
                        <>
                          {" "}With a market capitalization of{" "}
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
                          {" "}The stock is currently trading{" "}
                          <span className={isPositive ? "text-emerald-500" : "text-red-500"}>
                            {isPositive ? "up" : "down"} {formatChange(Math.abs(stock.quote.dp))}
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

                  {/* Raw Data Section */}
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
                    
                    <div className="grid grid-cols-2 divide-x divide-y divide-border">
                      {/* Current Price */}
                      <DataCell
                        icon={<DollarSign className="size-4" />}
                        label="Current Price"
                        value={formatPrice(stock.quote?.c ?? 0)}
                      />
                      
                      {/* Open Price */}
                      <DataCell
                        icon={<Activity className="size-4" />}
                        label="Open"
                        value={formatPrice(stock.quote?.o ?? 0)}
                      />
                      
                      {/* Day High */}
                      <DataCell
                        icon={<TrendingUp className="size-4" />}
                        label="Day High"
                        value={formatPrice(stock.quote?.h ?? 0)}
                        valueClass="text-emerald-500"
                      />
                      
                      {/* Day Low */}
                      <DataCell
                        icon={<TrendingDown className="size-4" />}
                        label="Day Low"
                        value={formatPrice(stock.quote?.l ?? 0)}
                        valueClass="text-red-500"
                      />
                      
                      {/* Previous Close */}
                      <DataCell
                        icon={<Calendar className="size-4" />}
                        label="Previous Close"
                        value={formatPrice(stock.quote?.pc ?? 0)}
                      />
                      
                      {/* Market Cap */}
                      <DataCell
                        icon={<Building2 className="size-4" />}
                        label="Market Cap"
                        value={formatMarketCap((stock.profile?.marketCapitalization ?? 0) * 1000000)}
                      />
                    </div>
                  </motion.section>

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
                            <div className="p-6 space-y-4">
                        {stock.profile.finnhubIndustry && (
                          <InfoRow icon={<Layers />} label="Industry" value={stock.profile.finnhubIndustry} />
                        )}
                        {stock.profile.country && (
                          <InfoRow icon={<Globe />} label="Country" value={stock.profile.country} />
                        )}
                        {stock.profile.exchange && (
                          <InfoRow icon={<Building2 />} label="Exchange" value={stock.profile.exchange} />
                        )}
                        {stock.profile.ipo && (
                          <InfoRow icon={<Calendar />} label="IPO Date" value={stock.profile.ipo} />
                        )}
                        {stock.profile.phone && (
                          <InfoRow icon={<Phone />} label="Phone" value={stock.profile.phone} />
                        )}
                        {stock.profile.shareOutstanding && (
                          <InfoRow
                            icon={<BarChart3 />}
                            label="Shares Outstanding"
                            value={formatVolume(stock.profile.shareOutstanding * 1000000)}
                          />
                        )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.section>
                  )}

                  {/* Analyze Section */}
                  <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-gradient-to-br from-primary/5 via-card to-card rounded-2xl border border-border p-6"
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
                      {!analysis.isAnalyzing && !analysis.result && (
                        <Button
                          onClick={runAnalysis}
                          className="gap-2 bg-primary hover:bg-primary/90"
                        >
                          <Sparkles className="size-4" />
                          Analyze Stock
                        </Button>
                      )}
                      {analysis.result && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={resetAnalysis}
                        >
                          Run Again
                        </Button>
                      )}
                    </div>

                    {/* Analysis Steps */}
                    {(analysis.isAnalyzing || analysis.result) && (
                      <div className="space-y-3">
                        {ANALYSIS_STEPS.map((step, index) => {
                          const isCompleted = analysis.completedSteps.includes(index);
                          const isCurrent = analysis.currentStep === index && analysis.isAnalyzing;
                          const isPending = index > analysis.currentStep && analysis.isAnalyzing;

                          return (
                            <motion.div
                              key={step.id}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.1 }}
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
                                  <CheckCircle2 className="size-5 text-emerald-500" />
                                ) : isCurrent ? (
                                  <Loader2 className="size-5 text-primary animate-spin" />
                                ) : (
                                  <div className="size-5 rounded-full border-2 border-muted-foreground/30" />
                                )}
                              </div>
                              <span
                                className={`text-sm ${
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
                                      className="size-1.5 rounded-full bg-primary"
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

                        {/* Result */}
                        <AnimatePresence>
                          {analysis.result && (
                            <motion.div
                              initial={{ opacity: 0, y: 10, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: -10 }}
                              className="mt-6 p-6 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/20"
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
                                Based on technical analysis, market sentiment, and historical patterns,
                                our AI model predicts a{" "}
                                <span className="font-medium text-foreground lowercase">
                                  {analysis.result}
                                </span>{" "}
                                outlook for {ticker} over the next 30 days.
                              </p>
                              <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                                <Activity className="size-3.5" />
                                <span>Analysis completed • Results are for informational purposes only</span>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}

                    {/* Empty State */}
                    {!analysis.isAnalyzing && !analysis.result && (
                      <div className="text-center py-8">
                        <div className="size-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                          <Sparkles className="size-8 text-primary" />
                        </div>
                        <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                          Click the button above to run a comprehensive AI analysis on{" "}
                          <span className="font-medium text-foreground">{ticker}</span>
                        </p>
                      </div>
                    )}
                  </motion.section>
                </div>
              ) : null}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
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
    <div className="p-4">
      <div className="flex items-center gap-2 text-muted-foreground mb-1">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <span className={`font-mono font-semibold ${valueClass}`}>{value}</span>
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
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-muted-foreground">
        <span className="size-4">{icon}</span>
        <span className="text-sm">{label}</span>
      </div>
      <span className="text-sm font-medium text-foreground">{value}</span>
    </div>
  );
}
