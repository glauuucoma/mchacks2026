import { useQuery } from "@tanstack/react-query";

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
 * NewsAPI response structure
 */
interface NewsAPIResponse {
  articles: Article[];
  status: string;
  totalResults: number;
}

/**
 * Service to handle all news-related API calls.
 * Calls NewsAPI directly from the frontend.
 */
export const newsService = {
  /**
   * Fetches the latest news headlines for a company.
   * @param query - The search query (e.g., "Apple stock").
   * @param dayOffset - How many days back to search for news (default: 3).
   * @returns Array of articles, filtered to English and limited to 6
   */
  getHeadlines: async (query: string, dayOffset: number = 3): Promise<Article[]> => {
    const NEWS_API_KEY = process.env.NEXT_PUBLIC_NEWS_API_KEY;
    
    if (!NEWS_API_KEY) {
      console.warn("NEXT_PUBLIC_NEWS_API_KEY is not set. News articles will not be fetched.");
      return [];
    }

    // Calculate from_date
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - dayOffset);
    const fromDateStr = fromDate.toISOString().split('T')[0]; // YYYY-MM-DD format

    // Build NewsAPI URL with the query
    const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&from=${fromDateStr}&sortBy=popularity&apiKey=${NEWS_API_KEY}`;

    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`NewsAPI error: ${response.status} ${response.statusText}`);
      }

      const data: NewsAPIResponse = await response.json();
      
      if (data.status !== 'ok') {
        throw new Error(`NewsAPI returned status: ${data.status}`);
      }

      // Simple language filter - keep English articles only
      // Note: We're doing a simple check here. For production, you might want to use a language detection library
      const enArticles = data.articles
        .filter((article) => {
          // Basic English language detection - check if title contains common English words/characters
          // In production, you'd use a proper language detection library
          const title = article.title?.toLowerCase() || '';
          return title.length > 0 && /^[a-z0-9\s\-.,!?'"]+$/i.test(article.title || '');
        })
        .slice(0, 6); // Limit to 6 articles

      return enArticles;
    } catch (error) {
      console.error("Failed to fetch news headlines:", error);
      return [];
    }
  },
};

/**
 * React Query hook for fetching news headlines for a company
 * @param query - The search query (e.g., "Apple stock")
 * @param enabled - Whether to enable the query (default: true)
 * @param dayOffset - How many days back to search for news (default: 3)
 */
export function useNewsHeadlines(
  query: string,
  enabled: boolean = true,
  dayOffset: number = 3
) {
  return useQuery({
    queryKey: ["newsHeadlines", query, dayOffset],
    queryFn: () => newsService.getHeadlines(query, dayOffset),
    enabled: enabled && !!query,
    staleTime: 300000, // 5 minutes - news doesn't change that frequently
    refetchOnWindowFocus: false,
  });
}