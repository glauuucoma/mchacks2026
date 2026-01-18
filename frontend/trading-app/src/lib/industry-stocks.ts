/**
 * Mapping of industries/sectors to recommended stocks
 * Prioritizing Canadian stocks where applicable
 */

export const INDUSTRY_STOCKS: Record<string, string[]> = {
  // Technology sector - includes Canadian and major tech
  technology: [
    "AAPL",   // Apple
    "GOOGL",  // Google
    "MSFT",   // Microsoft
    "NVDA",   // NVIDIA
    "IBM",    // IBM
    "DUOL",   // Duolingo
    "META",   // Meta
    "BB",     // BlackBerry (Canadian)
    "OTEX",   // Open Text (Canadian)
  ],

  // Financial Services - Canadian banks prioritized
  finance: [
    "BMO",    // Bank of Montreal (Canadian)
    "TD",     // Toronto-Dominion (Canadian)
    "BNS",    // Bank of Nova Scotia (Canadian)
    "CM",     // CIBC (Canadian)
    "MFC",    // Manulife (Canadian)
    "GS",     // Goldman Sachs
    "V",      // Visa
    "MA",     // Mastercard
    "JPM",    // JPMorgan
  ],

  // Energy sector - Canadian oil & gas prioritized
  energy: [
    "CNQ",    // Canadian Natural Resources (Canadian)
    "SU",     // Suncor (Canadian)
    "ENB",    // Enbridge (Canadian)
    "TRP",    // TC Energy (Canadian)
    "IMO",    // Imperial Oil (Canadian)
    "CVX",    // Chevron
    "COP",    // ConocoPhillips
    "BP",     // BP
  ],

  // Healthcare sector
  healthcare: [
    "JNJ",    // Johnson & Johnson
    "PFE",    // Pfizer
    "UNH",    // UnitedHealth
    "ABT",    // Abbott
    "MRK",    // Merck
    "LLY",    // Eli Lilly
  ],

  // Consumer Goods sector
  consumer: [
    "L",      // Loblaw (Canadian)
    "DOL",    // Dollarama (Canadian)
    "COST",   // Costco
    "WMT",    // Walmart
    "PG",     // Procter & Gamble
    "KO",     // Coca-Cola
  ],

  // Industrial sector
  industrial: [
    "CNI",    // CN Rail (Canadian)
    "CP",     // Canadian Pacific (Canadian)
    "TIH",    // Toromont (Canadian)
    "CAT",    // Caterpillar
    "DE",     // Deere
    "HON",    // Honeywell
    "UPS",    // UPS
  ],

  // Telecommunications sector
  telecommunications: [
    "BCE",    // Bell Canada (Canadian)
    "T",      // Telus (Canadian) / AT&T
    "VZ",     // Verizon
    "TMUS",   // T-Mobile
  ],

  // Utilities sector
  utilities: [
    "FTS",    // Fortis (Canadian)
    "H",      // Hydro One (Canadian)
    "AQN",    // Algonquin Power (Canadian)
    "NEE",    // NextEra Energy
    "DUK",    // Duke Energy
    "SO",     // Southern Company
  ],

  // Real Estate sector
  "real-estate": [
    "BAM",    // Brookfield Asset Management (Canadian)
    "BN",     // Brookfield Corp (Canadian)
    "FSV",    // FirstService (Canadian)
    "PLD",    // Prologis
    "AMT",    // American Tower
    "EQIX",   // Equinix
  ],

  // Materials sector
  materials: [
    "NTR",    // Nutrien (Canadian)
    "CCL",    // CCL Industries (Canadian)
    "LIN",    // Linde
    "NEM",    // Newmont
    "FCX",    // Freeport-McMoRan
  ],
};

/**
 * Get all unique stocks for the given sectors
 * @param sectors - Array of sector values (e.g., ["technology", "finance"])
 * @returns Array of unique stock tickers
 */
export function getStocksForSectors(sectors: string[]): string[] {
  const stocksSet = new Set<string>();

  for (const sector of sectors) {
    const sectorStocks = INDUSTRY_STOCKS[sector] || [];
    for (const stock of sectorStocks) {
      stocksSet.add(stock);
    }
  }

  return Array.from(stocksSet);
}

/**
 * Merge recommended stocks with existing tickers (no duplicates)
 * @param existingTickers - Current user tickers
 * @param newTickers - Tickers to add from industry selection
 * @returns Merged array with no duplicates
 */
export function mergeStocksWithExisting(
  existingTickers: string[],
  newTickers: string[]
): string[] {
  const tickersSet = new Set(existingTickers.map((t) => t.toUpperCase()));

  for (const ticker of newTickers) {
    tickersSet.add(ticker.toUpperCase());
  }

  return Array.from(tickersSet);
}
