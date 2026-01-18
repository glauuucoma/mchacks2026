import { create } from "zustand";
import { persist } from "zustand/middleware";

export type SortField = "price" | "change1h" | "change24h" | "change7d" | "volume" | "marketCap";
export type SortDirection = "asc" | "desc";

interface StocksState {
  tickers: string[];
  favorites: string[];
  sortField: SortField;
  sortDirection: SortDirection;
  addTicker: (ticker: string) => void;
  removeTicker: (ticker: string) => void;
  setTickers: (tickers: string[]) => void;
  toggleFavorite: (ticker: string) => void;
  isFavorite: (ticker: string) => boolean;
  setSortField: (field: SortField) => void;
  toggleSortDirection: () => void;
  setSortDirection: (direction: SortDirection) => void;
}

const useStocksStore = create<StocksState>()(
  persist(
    (set, get) => ({
      // Initial test tickers
      tickers: ["AAPL", "GOOGL", "MSFT"],
      favorites: [],
      sortField: "marketCap",
      sortDirection: "desc",

      addTicker: (ticker) =>
        set((state) => {
          const upperTicker = ticker.toUpperCase().trim();
          if (state.tickers.includes(upperTicker) || !upperTicker) {
            return state;
          }
          return { tickers: [...state.tickers, upperTicker] };
        }),

      removeTicker: (ticker) =>
        set((state) => ({
          tickers: state.tickers.filter((t) => t !== ticker),
          favorites: state.favorites.filter((t) => t !== ticker),
        })),

      setTickers: (tickers) => set({ tickers }),

      toggleFavorite: (ticker) =>
        set((state) => {
          const upperTicker = ticker.toUpperCase().trim();
          if (state.favorites.includes(upperTicker)) {
            return { favorites: state.favorites.filter((t) => t !== upperTicker) };
          }
          return { favorites: [...state.favorites, upperTicker] };
        }),

      isFavorite: (ticker) => get().favorites.includes(ticker.toUpperCase().trim()),

      setSortField: (field) =>
        set((state) => ({
          sortField: field,
          // Reset to desc when changing field
          sortDirection: state.sortField === field ? state.sortDirection : "desc",
        })),

      toggleSortDirection: () =>
        set((state) => ({
          sortDirection: state.sortDirection === "asc" ? "desc" : "asc",
        })),

      setSortDirection: (direction) => set({ sortDirection: direction }),
    }),
    {
      name: "trading-app-stocks",
    }
  )
);

export default useStocksStore;
