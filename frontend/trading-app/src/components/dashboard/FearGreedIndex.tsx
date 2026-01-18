"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Loader2, TrendingDown, TrendingUp, Minus } from "lucide-react";
import { useFearGreedIndex } from "@/lib/stocks-api";
import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
} from "@/components/ui/hover-card"
import { Button } from "../ui/button";

interface GaugeSegment {
  label: string;
  color: string;
  start: number;
  end: number;
}

const SEGMENTS: GaugeSegment[] = [
  { label: "Extreme Fear", color: "#ef4444", start: 0, end: 25 },
  { label: "Fear", color: "#f97316", start: 25, end: 45 },
  { label: "Neutral", color: "#eab308", start: 45, end: 55 },
  { label: "Greed", color: "#84cc16", start: 55, end: 75 },
  { label: "Extreme Greed", color: "#22c55e", start: 75, end: 100 },
];

function getSegmentForValue(value: number): GaugeSegment {
  return SEGMENTS.find((s) => value >= s.start && value < s.end) || SEGMENTS[0];
}

function getIndicatorIcon(classification: string) {
  const lower = classification.toLowerCase();
  if (lower.includes("fear")) return <TrendingDown className="size-4" />;
  if (lower.includes("greed")) return <TrendingUp className="size-4" />;
  return <Minus className="size-4" />;
}

export default function FearGreedIndex() {
  const { data, isLoading, isError } = useFearGreedIndex();

  const currentSegment = useMemo(() => {
    if (!data) return SEGMENTS[2]; // Default to Neutral
    return getSegmentForValue(data.value);
  }, [data]);

  // Calculate needle rotation (0 = left, 180 = right)
  const needleRotation = useMemo(() => {
    if (!data) return 90; // Point up for neutral
    return (data.value / 100) * 180;
  }, [data]);

  if (isLoading) {
    return (
      <div className="bg-card rounded-2xl border border-border shadow-sm p-6">
        <div className="flex items-center justify-center h-48">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-card rounded-2xl border border-border shadow-sm p-6">
        <div className="flex items-center justify-center h-48 text-muted-foreground">
          Failed to load Fear & Greed Index
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-6 pb-0">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-foreground">
              Fear & Greed Index
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Market sentiment indicator
            </p>
          </div>
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium"
            style={{
              backgroundColor: `${currentSegment.color}15`,
              color: currentSegment.color,
            }}
          >
            {getIndicatorIcon(data?.valueClassification || "Neutral")}
            {data?.valueClassification || "Loading"}
          </div>
        </div>
      </div>

      {/* Gauge */}
      <div className="px-6 py-8">
        <div className="relative mx-auto" style={{ width: 220, height: 120 }}>
          {/* Gauge background arc */}
          <svg
            viewBox="0 0 220 120"
            className="w-full h-full overflow-visible"
          >
            <defs>
              <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#ef4444" />
                <stop offset="25%" stopColor="#f97316" />
                <stop offset="50%" stopColor="#eab308" />
                <stop offset="75%" stopColor="#84cc16" />
                <stop offset="100%" stopColor="#22c55e" />
              </linearGradient>
            </defs>

            {/* Background arc */}
            <path
              d="M 20 110 A 90 90 0 0 1 200 110"
              fill="none"
              stroke="var(--border)"
              strokeWidth="16"
              strokeLinecap="round"
            />

            {/* Colored arc */}
            <motion.path
              d="M 20 110 A 90 90 0 0 1 200 110"
              fill="none"
              stroke="url(#gaugeGradient)"
              strokeWidth="16"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1, ease: "easeOut" }}
            />

            {/* Center value display */}
            <text
              x="110"
              y="150"
              textAnchor="middle"
              className="fill-foreground text-4xl font-bold"
              style={{ fontFamily: "var(--font-geist-mono)" }}
            >
              {data?.value ?? "--"}
            </text>
            <text
              x="110"
              y="170"
              textAnchor="middle"
              className="fill-muted-foreground text-xs"
            >
              / 100
            </text>
          </svg>

          {/* Needle */}
          <motion.div
            className="absolute bottom-[10px] left-1/2 origin-bottom"
            style={{ width: 4, height: 70, marginLeft: -2 }}
            initial={{ rotate: -90 }}
            animate={{ rotate: needleRotation - 90 }}
            transition={{ 
              type: "spring", 
              stiffness: 60, 
              damping: 15,
              delay: 0.5 
            }}
          >
            <div
              className="w-full h-full rounded-full"
              style={{ backgroundColor: currentSegment.color }}
            />
            <div
              className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 size-4 rounded-full border-2 border-card"
              style={{ backgroundColor: currentSegment.color }}
            />
          </motion.div>
        </div>
      </div>

      {/* Legend */}
      <div className="px-6 pt-12 pb-6">
        <div className="flex justify-between items-center">
          {SEGMENTS.map((segment) => (
            <div
              key={segment.label}
              className="flex flex-col items-center gap-1"
            >
              <div
                className="size-2.5 rounded-full"
                style={{ backgroundColor: segment.color }}
              />
              <span className="text-[10px] text-muted-foreground text-center leading-tight max-w-[50px]">
                {segment.label.replace(" ", "\n")}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-3 border-t border-border bg-muted/30">
        <p className="text-sm text-muted-foreground text-center">
          Based on market volatility, momentum, and sentiment data
          <HoverCard>
      <HoverCardTrigger asChild>
        <Button variant="link" className="text-sm pl-[5px]">*</Button>
      </HoverCardTrigger>
      <HoverCardContent className="w-80">
        <div className="flex justify-between gap-4">
          Data provided by Finnhub API
        </div>
      </HoverCardContent>
    </HoverCard>
        </p>
      </div>
    </div>
  );
}
