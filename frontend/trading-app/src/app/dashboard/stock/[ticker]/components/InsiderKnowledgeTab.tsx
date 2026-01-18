/**
 * InsiderKnowledgeTab Component
 * 
 * Displays congressional trading activity for a specific stock ticker.
 * Shows trades made by members of Congress with their photos, party affiliation,
 * trade details, and filing information.
 * 
 * SECTIONS:
 * ---------
 * 1. Header - Title and disclaimer about STOCK Act filings
 * 2. Loading State - Spinner while fetching data
 * 3. Trades List - Grid of congress member trade cards
 * 4. Empty State - Message when no trades found
 */

"use client";

import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Loader2,
  Users,
  Landmark,
} from "lucide-react";
import type { CongressPerson } from "../data";

// =============================================================================
// TYPES
// =============================================================================

interface InsiderKnowledgeTabProps {
  congressData: CongressPerson[];
  isLoading: boolean;
  ticker: string;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Returns color classes based on political party affiliation
 */
function getPartyColor(party: string) {
  const p = party?.toLowerCase() || "";
  if (p.includes("republican")) {
    return { bg: "bg-red-500/10", text: "text-red-600", border: "border-red-500/30" };
  }
  if (p.includes("democrat")) {
    return { bg: "bg-blue-500/10", text: "text-blue-600", border: "border-blue-500/30" };
  }
  return { bg: "bg-gray-500/10", text: "text-gray-600", border: "border-gray-500/30" };
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

/**
 * Header section with title and disclaimer
 */
function TabHeader({ ticker }: { ticker: string }) {
  return (
    <div className="bg-card rounded-2xl border border-border p-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="size-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-500/5 flex items-center justify-center">
          <Landmark className="size-6 text-amber-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">
            Congressional Trading Activity
          </h2>
          <p className="text-sm text-muted-foreground">
            Recent stock transactions by members of Congress for {ticker}
          </p>
        </div>
      </div>
      <p className="text-xs text-muted-foreground mt-4 p-3 bg-muted/50 rounded-lg">
        <strong>Disclaimer:</strong> This data is compiled from public STOCK Act filings. 
        Trading activity by members of Congress may be disclosed up to 45 days after the transaction.
      </p>
    </div>
  );
}

/**
 * Loading state with spinner
 */
function LoadingState() {
  return (
    <div className="bg-card rounded-2xl border border-border p-12">
      <div className="flex flex-col items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground mb-4" />
        <p className="text-sm text-muted-foreground">
          Loading congressional trading data...
        </p>
      </div>
    </div>
  );
}

/**
 * Empty state when no trades found
 */
function EmptyState({ ticker }: { ticker: string }) {
  return (
    <div className="bg-card rounded-2xl border border-border p-12 text-center">
      <div className="size-16 mx-auto rounded-2xl bg-muted flex items-center justify-center mb-4">
        <Users className="size-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">
        No Congressional Trades Found
      </h3>
      <p className="text-sm text-muted-foreground max-w-md mx-auto">
        No recent trading activity by members of Congress has been reported for {ticker}.
      </p>
    </div>
  );
}

/**
 * Individual congress member trade card
 */
function TradeCard({ person, index }: { person: CongressPerson; index: number }) {
  const partyColors = getPartyColor(person.party);
  
  return (
    <motion.div
      key={person.id || index}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-card rounded-2xl border border-border overflow-hidden hover:shadow-lg transition-shadow"
    >
      <div className="p-6">
        <div className="flex items-start gap-4">
          {/* Member Photo */}
          <MemberPhoto person={person} partyColors={partyColors} />

          {/* Member Info */}
          <div className="flex-1 min-w-0">
            <MemberHeader person={person} partyColors={partyColors} />
            <TradeDetails person={person} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Member photo with party indicator badge
 */
function MemberPhoto({ 
  person, 
  partyColors 
}: { 
  person: CongressPerson; 
  partyColors: ReturnType<typeof getPartyColor>;
}) {
  return (
    <div className="relative shrink-0">
      <div className="size-16 rounded-xl bg-primary/10 flex items-center justify-center overflow-hidden">
        {person.photo_url ? (
          <img
            src={person.photo_url}
            alt={person.name || "Congress Member"}
            className="size-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
              const parent = (e.target as HTMLImageElement).parentElement;
              if (parent) {
                parent.innerHTML = `<span class="text-lg font-bold text-primary">${(person.name || 'C').split(' ').map((n: string) => n[0]).join('')}</span>`;
              }
            }}
          />
        ) : (
          <span className="text-lg font-bold text-primary">
            {(person.name || 'C').split(' ').map((n: string) => n[0]).join('')}
          </span>
        )}
      </div>
      {/* Party indicator */}
      <div className={`absolute -bottom-1 -right-1 size-5 rounded-full ${partyColors.bg} ${partyColors.border} border flex items-center justify-center`}>
        <span className={`text-[10px] font-bold ${partyColors.text}`}>
          {person.party?.charAt(0) || "?"}
        </span>
      </div>
    </div>
  );
}

/**
 * Member name and party/state info
 */
function MemberHeader({ 
  person, 
  partyColors 
}: { 
  person: CongressPerson; 
  partyColors: ReturnType<typeof getPartyColor>;
}) {
  return (
    <>
      <div className="flex items-center gap-2 flex-wrap">
        <h3 className="font-semibold text-foreground text-lg">
          {person.name || "Unknown Member"}
        </h3>
        <span className={`text-xs px-2 py-0.5 rounded-full ${partyColors.bg} ${partyColors.text} font-medium`}>
          {person.party || "Unknown"} • {person.state || "N/A"}
        </span>
      </div>
      <p className="text-sm text-muted-foreground mt-1">
        U.S. Congress
      </p>
    </>
  );
}

/**
 * Trade details grid (transaction type, amount, dates)
 */
function TradeDetails({ person }: { person: CongressPerson }) {
  const tradeType = person.trade_type?.toLowerCase();
  
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
      {/* Transaction Type */}
      <div>
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
          Transaction
        </p>
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-medium ${
            tradeType === "buy"
              ? "bg-emerald-500/10 text-emerald-600"
              : tradeType === "sell"
              ? "bg-red-500/10 text-red-600"
              : "bg-amber-500/10 text-amber-600"
          }`}
        >
          {tradeType === "buy" ? (
            <TrendingUp className="size-3.5" />
          ) : tradeType === "sell" ? (
            <TrendingDown className="size-3.5" />
          ) : (
            <Activity className="size-3.5" />
          )}
          {person.trade_type?.toUpperCase() || "UNKNOWN"}
        </span>
      </div>

      {/* Amount */}
      <div>
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
          Amount
        </p>
        <p className="font-semibold text-foreground font-mono text-sm">
          {person.size || "N/A"}
        </p>
      </div>

      {/* Trade Date */}
      <div>
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
          Trade Date
        </p>
        <p className="font-medium text-foreground text-sm">
          {person.trade_date || "N/A"}
        </p>
      </div>

      {/* Filing Date */}
      <div>
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
          Filing Date
        </p>
        <div className="flex items-center gap-1.5">
          <p className="font-medium text-foreground text-sm">
            {person.filing_date || "N/A"}
          </p>
          {person.reporting_gap && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
              {person.reporting_gap}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function InsiderKnowledgeTab({
  congressData,
  isLoading,
  ticker,
}: InsiderKnowledgeTabProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      {/* Header */}
      <TabHeader ticker={ticker} />

      {/* Content */}
      {isLoading ? (
        <LoadingState />
      ) : congressData && congressData.length > 0 ? (
        <div className="grid gap-4">
          {congressData.map((person, index) => (
            <TradeCard key={person.id || index} person={person} index={index} />
          ))}
        </div>
      ) : (
        <EmptyState ticker={ticker} />
      )}
    </motion.div>
  );
}
