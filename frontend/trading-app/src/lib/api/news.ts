import { apiRequest } from "./client";

/**
 * Interface representing the structure of a single news article
 * for type safety across the frontend.
 */
export interface Article {
  title: string;
  description: string;
  url: string;
  urlToImage?: string;
  publishedAt: string;
  source: {
    name: string;
  };
}

/**
 * Service to handle all news-related API calls.
 */
export const newsService = {
  /**
   * Fetches the latest news headlines for a specific ticker.
   * @param ticker - The stock ticker symbol (e.g., "AAPL").
   * @param dayOffset - How many days back to search for news (default: 3).
   */
  getHeadlines: async (ticker: string, dayOffset: number = 3): Promise<Article[]> => {
    const response = await apiRequest("/api/get_news_headlines", {
      method: "POST",
      body: JSON.stringify({ ticker, day_offset: dayOffset }),
    });

    // Your FastAPI returns an object { "articles": [...] }
    return response.articles;
  },
};