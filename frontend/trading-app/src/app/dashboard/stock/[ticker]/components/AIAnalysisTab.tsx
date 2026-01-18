/**
 * AIAnalysisTab Component
 * 
 * Displays AI-powered stock analysis results with a visual barometer gauge
 * and breakdown by different data sources (ML model, news, congress, social media).
 * 
 * SECTIONS:
 * ---------
 * 1. Empty State - Prompt to start analysis
 * 2. Barometer Card - Visual gauge showing overall recommendation
 * 3. Source Breakdown - Individual recommendations from each data source
 * 4. Action Buttons - Re-run analysis
 */

"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  Activity,
  Sparkles,
  Loader2,
  Target,
  Brain,
  Newspaper,
  MessageSquare,
  Landmark,
  Calculator,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SourceWeights } from "@/store/preferences";
import type { AnalysisState, AnalysisResult } from "../data";

// =============================================================================
// TYPES
// =============================================================================

interface AIAnalysisTabProps {
  analysis: AnalysisState;
  sourceWeights: SourceWeights;
  runAnalysis: () => void;
  resetAnalysis: () => void;
  ticker: string;
}

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Information about each analysis source
 */
const SOURCE_INFO: Record<
  keyof SourceWeights,
  { label: string; icon: React.ReactNode; description: string }
> = {
  "ml-model": {
    label: "Machine Learning Model",
    icon: <Brain className="size-5" />,
    description: "AI prediction based on historical patterns and technical indicators",
  },
  "math-formula": {
    label: "Math Formulas",
    icon: <Calculator className="size-5" />,
    description: "Mathematical prediction based on quantitative analysis",
  },
  "news-outlets": {
    label: "News Outlets",
    icon: <Newspaper className="size-5" />,
    description: "Sentiment analysis from major financial news sources",
  },
  congress: {
    label: "Members of Congress",
    icon: <Landmark className="size-5" />,
    description: "Analysis of congressional trading activity",
  },
  "social-media": {
    label: "Social Media (Reddit)",
    icon: <MessageSquare className="size-5" />,
    description: "Community sentiment from r/wallstreetbets and r/stocks",
  },
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get text color class for recommendation
 */
function getRecommendationColor(rec: "buy" | "sell" | "hold") {
  if (rec === "buy") return "text-emerald-500";
  if (rec === "sell") return "text-red-500";
  return "text-amber-500";
}

/**
 * Get background color class for recommendation
 */
function getRecommendationBg(rec: "buy" | "sell" | "hold") {
  if (rec === "buy") return "bg-emerald-500/10";
  if (rec === "sell") return "bg-red-500/10";
  return "bg-amber-500/10";
}

/**
 * Get overall recommendation label and color based on score
 */
function getOverallRecommendation(score: number) {
  if (score > 30) return { label: "Strong Buy", color: "#22c55e" };
  if (score > 10) return { label: "Buy", color: "#84cc16" };
  if (score > -10) return { label: "Hold", color: "#eab308" };
  if (score > -30) return { label: "Sell", color: "#f97316" };
  return { label: "Strong Sell", color: "#ef4444" };
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

/**
 * Empty state prompting user to start analysis
 */
function EmptyState({ 
  ticker, 
  runAnalysis, 
  isAnalyzing 
}: { 
  ticker: string; 
  runAnalysis: () => void; 
  isAnalyzing: boolean;
}) {
  return (
    <div className="bg-card rounded-2xl border border-border p-12 text-center">
      <div className="size-20 mx-auto rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-6">
        <Brain className="size-10 text-primary" />
      </div>
      <h2 className="text-2xl font-bold text-foreground mb-3">
        AI Analysis for {ticker}
      </h2>
      <p className="text-muted-foreground max-w-md mx-auto mb-8">
        Run our comprehensive AI analysis to get personalized buy/sell recommendations
        based on your weighted preferences.
      </p>
      <Button
        onClick={runAnalysis}
        size="lg"
        className="gap-2 bg-primary hover:bg-primary/90"
        disabled={isAnalyzing}
      >
        {isAnalyzing ? (
          <>
            <Loader2 className="size-5 animate-spin" />
            Analyzing...
          </>
        ) : (
          <>
            <Sparkles className="size-5" />
            Start Analysis
          </>
        )}
      </Button>
    </div>
  );
}

/**
 * Barometer gauge visualization
 */
function BarometerCard({ overallScore }: { overallScore: number }) {
  // Calculate needle rotation based on overall score (-100 to 100)
  const needleRotation = useMemo(() => {
    // Map -100 to 100 → 0 to 180 degrees
    return ((overallScore + 100) / 200) * 180;
  }, [overallScore]);

  const recommendation = getOverallRecommendation(overallScore);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-card rounded-2xl border border-border overflow-hidden"
    >
      {/* Header */}
      <div className="p-6 border-b border-border">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Target className="size-5 text-primary" />
          Overall Recommendation
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Weighted analysis based on your source preferences
        </p>
      </div>

      {/* Gauge */}
      <div className="p-8 py-16">
        <div className="relative mx-auto" style={{ width: 320, height: 180 }}>
          <svg viewBox="0 0 320 180" className="w-full h-full overflow-visible">
            <defs>
              <linearGradient id="barometerGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#ef4444" />
                <stop offset="25%" stopColor="#f97316" />
                <stop offset="50%" stopColor="#eab308" />
                <stop offset="75%" stopColor="#84cc16" />
                <stop offset="100%" stopColor="#22c55e" />
              </linearGradient>
            </defs>

            {/* Background arc */}
            <path
              d="M 30 160 A 130 130 0 0 1 290 160"
              fill="none"
              stroke="var(--border)"
              strokeWidth="24"
              strokeLinecap="round"
            />

            {/* Colored arc */}
            <motion.path
              d="M 30 160 A 130 130 0 0 1 290 160"
              fill="none"
              stroke="url(#barometerGradient)"
              strokeWidth="24"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1, ease: "easeOut" }}
            />

            {/* Labels */}
            <text x="20" y="225" className="fill-red-500 text-sm font-bold">
              SELL
            </text>
            <text x="270" y="225" className="fill-emerald-500 text-sm font-bold">
              BUY
            </text>
          </svg>

          {/* Needle */}
          <motion.div
            className="absolute bottom-[20px] left-1/2 origin-bottom"
            style={{ width: 6, height: 100, marginLeft: -3 }}
            initial={{ rotate: -90 }}
            animate={{ rotate: needleRotation - 90 }}
            transition={{
              type: "spring",
              stiffness: 60,
              damping: 15,
              delay: 0.5,
            }}
          >
            <div
              className="w-full h-full rounded-full"
              style={{ backgroundColor: recommendation.color }}
            />
            <div
              className="absolute -bottom-2 left-1/2 -translate-x-1/2 size-5 rounded-full border-2 border-card"
              style={{ backgroundColor: recommendation.color }}
            />
          </motion.div>

          {/* Center Value */}
          <div className="absolute bottom-[-80px] left-1/2 -translate-x-1/2 text-center">
            <p
              className="text-2xl font-bold"
              style={{ color: recommendation.color }}
            >
              {recommendation.label}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Score: {overallScore > 0 ? "+" : ""}{overallScore}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Individual source result card
 */
function SourceCard({ 
  sourceKey, 
  result, 
  index 
}: { 
  sourceKey: keyof SourceWeights;
  result: { recommendation: "buy" | "sell" | "hold"; score: number };
  index: number;
}) {
  const source = SOURCE_INFO[sourceKey];

  return (
    <motion.div
      key={sourceKey}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3 + index * 0.1 }}
      className="bg-card rounded-xl border border-border p-4"
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div
          className={`size-12 rounded-xl flex items-center justify-center shrink-0 ${getRecommendationBg(
            result.recommendation
          )}`}
        >
          <span className={getRecommendationColor(result.recommendation)}>
            {source.icon}
          </span>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h3 className="font-semibold text-foreground">
                {source.label}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {source.description}
              </p>
            </div>
            <div className="text-right">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold ${getRecommendationBg(
                  result.recommendation
                )} ${getRecommendationColor(result.recommendation)}`}
              >
                {result.recommendation === "buy" && <TrendingUp className="size-4" />}
                {result.recommendation === "sell" && <TrendingDown className="size-4" />}
                {result.recommendation === "hold" && <Activity className="size-4" />}
                {result.recommendation.toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Source breakdown section
 */
function SourceBreakdown({ 
  sources 
}: { 
  sources: AnalysisResult["sources"];
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-card rounded-2xl border border-border overflow-hidden"
    >
      <div className="p-6 border-b border-border">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <BarChart3 className="size-5 text-primary" />
          Analysis Breakdown by Source
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Individual recommendations weighted by your preferences
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
        {(Object.keys(SOURCE_INFO) as Array<keyof SourceWeights>).map((sourceKey, index) => (
          <SourceCard
            key={sourceKey}
            sourceKey={sourceKey}
            result={sources[sourceKey]}
            index={index}
          />
        ))}
      </div>
    </motion.div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function AIAnalysisTab({
  analysis,
  runAnalysis,
  resetAnalysis,
  ticker,
}: AIAnalysisTabProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      {!analysis.result ? (
        <EmptyState 
          ticker={ticker} 
          runAnalysis={runAnalysis} 
          isAnalyzing={analysis.isAnalyzing} 
        />
      ) : (
        <>
          {/* Barometer Card */}
          <BarometerCard overallScore={analysis.result.overall} />

          {/* Source Breakdown */}
          <SourceBreakdown sources={analysis.result!.sources} />

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={resetAnalysis}
              className="flex-1 gap-2"
            >
              <Sparkles className="size-4" />
              Run New Analysis
            </Button>
          </div>
        </>
      )}
    </motion.div>
  );
}
