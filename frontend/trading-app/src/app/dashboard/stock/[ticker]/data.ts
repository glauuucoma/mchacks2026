import { FileText, Users, Brain } from  "lucide-react";
import {type TimeRange } from "@/lib/stocks-api";

// Tab types
export type TabType = "stock-info" | "insider-knowledge" | "ai-analysis";

// Analysis steps for the loading animation UI
export const ANALYSIS_STEPS = [
  { id: 1, title: "Fetching historical price data", duration: 1200 },
  { id: 2, title: "Analyzing trading patterns", duration: 1500 },
  { id: 3, title: "Calculating technical indicators", duration: 1800 },
  { id: 4, title: "Running sentiment analysis", duration: 2000 },
  { id: 5, title: "Evaluating market conditions", duration: 1400 },
  { id: 6, title: "Generating AI predictions", duration: 2200 },
  { id: 7, title: "Compiling final report", duration: 1000 },
];

export const TIME_RANGES: TimeRange[] = ["1D", "1W", "1M", "3M", "6M", "1Y", "5Y"];

export const TABS = [
  { id: "stock-info" as TabType, label: "Stock Info", icon: FileText },
  { id: "insider-knowledge" as TabType, label: "Insider Knowledge", icon: Users },
  { id: "ai-analysis" as TabType, label: "AI Analysis", icon: Brain },
];

export interface AnalysisState {
    isAnalyzing: boolean;
    currentStep: number;
    completedSteps: number[];
    result: AnalysisResult | null;
  }
  
export interface AnalysisResult {
    overall: number;
    sources: {
      "ml-model": { recommendation: "buy" | "sell" | "hold"; score: number };
      "news-outlets": { recommendation: "buy" | "sell" | "hold"; score: number };
      congress: { recommendation: "buy" | "sell" | "hold"; score: number };
      "social-media": { recommendation: "buy" | "sell" | "hold"; score: number };
    };
  }
  
export interface CongressPerson {
    name?: string;
    office?: string;
    type?: string;
    amount?: string;
    transactionDate?: string;
    photo_url?: string;
    [key: string]: string | undefined;
  }