"use client";

import { useMemo, useState, useCallback, memo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  X,
  Eye,
  Search,
  Plus,
  TrendingUp,
  TrendingDown,
  Loader2,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import useStocksStore, { SortField, SortDirection } from "@/store/stocks";
import { useStocksData, useStockSearch, StockData } from "@/lib/stocks-api";
import { formatPrice, formatMarketCap, formatVolume, formatChange } from "./utils"

// Memoized change indicator component
const ChangeIndicator = memo(function ChangeIndicator({ value }: { value: number }) {
  const isPositive = value >= 0;
  return (
    <span
      className={`inline-flex items-center gap-1 font-medium ${
        isPositive ? "text-emerald-500" : "text-red-500"
      }`}
    >
      {isPositive ? (
        <TrendingUp className="size-3" />
      ) : (
        <TrendingDown className="size-3" />
      )}
      {formatChange(value)}
    </span>
  );
});

// Column header component with sorting
interface ColumnHeaderProps {
  field: SortField;
  label: string;
  currentSort: SortField;
  direction: SortDirection;
  onSort: (field: SortField) => void;
  align?: "left" | "right";
}

const ColumnHeader = memo(function ColumnHeader({
  field,
  label,
  currentSort,
  direction,
  onSort,
  align = "right",
}: ColumnHeaderProps) {
  const isActive = currentSort === field;

  return (
    <button
      onClick={() => onSort(field)}
      className={`flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors ${
        align === "left" ? "justify-start" : "justify-end"
      } ${isActive ? "text-foreground" : ""}`}
    >
      {label}
      {isActive ? (
        direction === "asc" ? (
          <ArrowUp className="size-3" />
        ) : (
          <ArrowDown className="size-3" />
        )
      ) : (
        <ArrowUpDown className="size-3 opacity-40" />
      )}
    </button>
  );
});

// Stock row component
interface StockRowProps {
  stock: StockData;
  onRemove: (ticker: string) => void;
  onView: (ticker: string) => void;
  onToggleFavorite: (ticker: string) => void;
  isFavorite: boolean;
}

const StockRow = memo(function StockRow({ stock, onRemove, onView, onToggleFavorite, isFavorite }: StockRowProps) {
  return (
    <motion.tr
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="group border-b border-border/50 hover:bg-muted/30 transition-colors"
    >
      {/* Favorite Star */}
      <td className="py-4 px-2">
        <button
          onClick={() => onToggleFavorite(stock.ticker)}
          className={`p-1.5 rounded-lg transition-all cursor-pointer ${
            isFavorite
              ? "text-yellow-500 hover:text-yellow-600"
              : "opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-yellow-500 hover:bg-yellow-500/10"
          }`}
          aria-label={isFavorite ? `Remove ${stock.ticker} from favorites` : `Add ${stock.ticker} to favorites`}
        >
          <Star className={`size-4 ${isFavorite ? "fill-current" : ""}`} />
        </button>
      </td>

      {/* Ticker & Name */}
      <td className="py-4 px-4">
        <div className="flex items-center gap-3">
          {stock.logo ? (
            <img
              src={stock.logo}
              alt={stock.ticker}
              className="size-8 rounded-lg object-contain bg-white"
            />
          ) : (
            <div className="size-8 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <span className="text-xs font-bold text-primary">
                {stock.ticker.slice(0, 2)}
              </span>
            </div>
          )}
          <div>
            <div className="font-semibold text-foreground">{stock.ticker}</div>
            <div className="text-xs text-muted-foreground truncate max-w-[120px]">
              {stock.name}
            </div>
          </div>
        </div>
      </td>

      {/* Price */}
      <td className="py-4 px-4 text-right font-mono font-medium">
        {formatPrice(stock.price)}
      </td>

      {/* 1h Change */}
      <td className="py-4 px-4 text-right">
        <ChangeIndicator value={stock.change1h} />
      </td>

      {/* 24h Change */}
      <td className="py-4 px-4 text-right">
        <ChangeIndicator value={stock.change24h} />
      </td>

      {/* 7d Change */}
      <td className="py-4 px-4 text-right">
        <ChangeIndicator value={stock.change7d} />
      </td>

      {/* Volume */}
      <td className="py-4 px-4 text-right font-mono text-muted-foreground">
        {formatVolume(stock.volume)}
      </td>

      {/* Market Cap */}
      <td className="py-4 px-4 text-right font-mono text-muted-foreground">
        {formatMarketCap(stock.marketCap)}
      </td>

        <td className="py-4 px-2 text-right">
      {/* View button */}
        <button
          onClick={() => onView(stock.ticker)}
          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-all cursor-pointer"
          aria-label={`View ${stock.ticker}`}
        >
          <Eye className="size-4" />
        </button>
        </td>
      {/* Remove button */}
      <td className="py-4 px-2 text-right">
        <button
          onClick={() => onRemove(stock.ticker)}
          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all cursor-pointer"
          aria-label={`Remove ${stock.ticker}`}
        >
          <X className="size-4" />
        </button>
    </td>
    </motion.tr>
  );
});

// Search dropdown component
interface SearchDropdownProps {
  query: string;
  onSelect: (symbol: string) => void;
}

const SearchDropdown = memo(function SearchDropdown({
  query,
  onSelect,
}: SearchDropdownProps) {
  const { data: results, isLoading } = useStockSearch(query);

  if (!query || query.length < 1) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden"
    >
      {isLoading ? (
        <div className="p-4 flex items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          <span>Searching...</span>
        </div>
      ) : results && results.length > 0 ? (
        <ul className="max-h-[300px] overflow-y-auto">
          {results.map((result) => (
            <li key={result.symbol}>
              <button
                onClick={() => onSelect(result.symbol)}
                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-muted/50 transition-colors text-left"
              >
                <div className="size-8 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-primary">
                    {result.symbol.slice(0, 2)}
                  </span>
                </div>
                <div className="min-w-0">
                  <div className="font-semibold">{result.symbol}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {result.description}
                  </div>
                </div>
                <Plus className="size-4 text-muted-foreground ml-auto shrink-0" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="p-4 text-center text-muted-foreground">
          No stocks found for &quot;{query}&quot;
        </div>
      )}
    </motion.div>
  );
});

// Main StockList component
export default function StockList() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const {
    tickers,
    favorites,
    sortField,
    sortDirection,
    addTicker,
    removeTicker,
    toggleFavorite,
    setSortField,
    toggleSortDirection,
  } = useStocksStore();

  const { data: stocksData, isLoading, isError } = useStocksData(tickers);

  // Handle sort
  const handleSort = useCallback(
    (field: SortField) => {
      if (sortField === field) {
        toggleSortDirection();
      } else {
        setSortField(field);
      }
    },
    [sortField, setSortField, toggleSortDirection]
  );

  // Handle adding ticker
  const handleAddTicker = useCallback(
    (symbol: string) => {
      addTicker(symbol);
      setSearchQuery("");
      setIsSearchFocused(false);
    },
    [addTicker]
  );

  // Handle removing ticker
  const handleRemoveTicker = useCallback(
    (ticker: string) => {
      removeTicker(ticker);
    },
    [removeTicker]
  );

  // Handle toggling favorite
  const handleToggleFavorite = useCallback(
    (ticker: string) => {
      toggleFavorite(ticker);
    },
    [toggleFavorite]
  );

  // Handle viewing stock details - navigate to stock detail page
  const handleViewStock = useCallback((ticker: string) => {
    router.push(`/dashboard/stock/${ticker.toLowerCase()}`);
  }, [router]);

  // Sort stocks (deduplicate by ticker first to avoid duplicate key errors)
  // Favorites are always shown at the top
  const sortedStocks = useMemo(() => {
    if (!stocksData) return [];

    // Deduplicate by ticker - keep first occurrence
    const seen = new Set<string>();
    const uniqueStocks = stocksData.filter((stock) => {
      if (seen.has(stock.ticker)) return false;
      seen.add(stock.ticker);
      return true;
    });

    return uniqueStocks.sort((a, b) => {
      // Favorites always come first
      const aIsFavorite = favorites.includes(a.ticker);
      const bIsFavorite = favorites.includes(b.ticker);
      
      if (aIsFavorite && !bIsFavorite) return -1;
      if (!aIsFavorite && bIsFavorite) return 1;
      
      // Within same favorite status, sort by field
      const aValue = a[sortField];
      const bValue = b[sortField];
      const multiplier = sortDirection === "asc" ? 1 : -1;
      return (aValue - bValue) * multiplier;
    });
  }, [stocksData, sortField, sortDirection, favorites]);

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-foreground">Your Watchlist</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Track your favorite stocks in real-time
            </p>
          </div>

          {/* Search input */}
          <div className="relative w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                placeholder="Add stock..."
                className="w-full pl-10 pr-4 py-2.5 bg-muted/50 border border-border rounded-xl text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring transition-all"
              />
            </div>

            <AnimatePresence>
              {isSearchFocused && searchQuery && (
                <SearchDropdown query={searchQuery} onSelect={handleAddTicker} />
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="py-3 px-2 w-10"></th>
              <th className="py-3 px-4 text-left">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Stock
                </span>
              </th>
              <th className="py-3 px-4">
                <ColumnHeader
                  field="price"
                  label="Price"
                  currentSort={sortField}
                  direction={sortDirection}
                  onSort={handleSort}
                />
              </th>
              <th className="py-3 px-4">
                <ColumnHeader
                  field="change1h"
                  label="1h"
                  currentSort={sortField}
                  direction={sortDirection}
                  onSort={handleSort}
                />
              </th>
              <th className="py-3 px-4">
                <ColumnHeader
                  field="change24h"
                  label="24h"
                  currentSort={sortField}
                  direction={sortDirection}
                  onSort={handleSort}
                />
              </th>
              <th className="py-3 px-4">
                <ColumnHeader
                  field="change7d"
                  label="7d"
                  currentSort={sortField}
                  direction={sortDirection}
                  onSort={handleSort}
                />
              </th>
              <th className="py-3 px-4">
                <ColumnHeader
                  field="volume"
                  label="Volume"
                  currentSort={sortField}
                  direction={sortDirection}
                  onSort={handleSort}
                />
              </th>
              <th className="py-3 px-4">
                <ColumnHeader
                  field="marketCap"
                  label="Market Cap"
                  currentSort={sortField}
                  direction={sortDirection}
                  onSort={handleSort}
                />
              </th>
              <th className="py-3 px-2 w-12"></th>
              <th className="py-3 px-2 w-12"></th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={10} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="size-8 animate-spin text-muted-foreground" />
                    <span className="text-muted-foreground">Loading stocks...</span>
                  </div>
                </td>
              </tr>
            ) : isError ? (
              <tr>
                <td colSpan={10} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <span className="text-destructive">Failed to load stocks</span>
                    <Button variant="outline" size="sm">
                      Try Again
                    </Button>
                  </div>
                </td>
              </tr>
            ) : sortedStocks.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="size-12 rounded-full bg-muted flex items-center justify-center">
                      <Search className="size-5 text-muted-foreground" />
                    </div>
                    <span className="text-muted-foreground">
                      No stocks in your watchlist. Use the search to add some!
                    </span>
                  </div>
                </td>
              </tr>
            ) : (
              <AnimatePresence mode="popLayout">
                {sortedStocks.map((stock) => (
                  <StockRow
                    key={stock.ticker}
                    stock={stock}
                    onRemove={handleRemoveTicker}
                    onView={handleViewStock}
                    onToggleFavorite={handleToggleFavorite}
                    isFavorite={favorites.includes(stock.ticker)}
                  />
                ))}
              </AnimatePresence>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      {sortedStocks.length > 0 && (
        <div className="px-6 py-3 border-t border-border bg-muted/30">
          <p className="text-xs text-muted-foreground">
            {sortedStocks.length} stock{sortedStocks.length !== 1 ? "s" : ""} in
            watchlist • Updates every minute
          </p>
        </div>
      )}
    </div>
  );
}
