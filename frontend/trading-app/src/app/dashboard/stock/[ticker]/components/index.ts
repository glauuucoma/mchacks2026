/**
 * Stock Detail Page Components
 * 
 * This file exports all components used in the stock detail page.
 * 
 * COMPONENT STRUCTURE:
 * ====================
 * 
 * 1. DataCell - Reusable data display cell with icon and label
 * 
 * 2. Tabs:
 *    - StockInfoTab - Main stock information (chart, metrics, company info)
 *    - InsiderKnowledgeTab - Congressional trading activity
 *    - AIAnalysisTab - AI-powered stock analysis with barometer
 * 
 * 3. Sub-components (used within StockInfoTab):
 *    - SummarySection - Company summary with AI chat
 *    - PriceChart - Interactive stock price chart
 *    - MarketDataSection - Current market data grid
 *    - FinancialMetricsSection - Key metrics & ratios (expandable)
 *    - CompanyInfoSection - Company details (expandable)
 *    - AIAnalysisSidebar - AI analysis trigger and progress
 */

export { DataCell } from "./DataCell";
export { StockInfoTab } from "./StockInfoTab";
export { InsiderKnowledgeTab } from "./InsiderKnowledgeTab";
export { AIAnalysisTab } from "./AIAnalysisTab";
