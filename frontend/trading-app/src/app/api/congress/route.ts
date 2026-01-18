import { NextRequest, NextResponse } from "next/server";

const AINVEST_API_KEY = "NSbP5VwkTjMKI62URz22AFAuONv7h4Dy";

interface CongressTrade {
  id: string;
  size: string;
  reporting_gap: string;
  name: string;
  trade_type: string;
  filing_date: string;
  state: string;
  trade_date: string;
  party: string;
  photo_url?: string;
}

interface AInvestResponse {
  data: {
    data: CongressTrade[];
  };
  status_code: number;
  status_msg: string;
}

// Fetch Wikipedia image for a person
async function getWikipediaImage(personName: string): Promise<string | null> {
  try {
    const searchUrl = "https://en.wikipedia.org/w/api.php";
    
    const params = new URLSearchParams({
      action: "query",
      format: "json",
      titles: personName,
      prop: "pageimages",
      piprop: "original",
      origin: "*",
    });
    
    const response = await fetch(`${searchUrl}?${params}`, {
      headers: {
        "User-Agent": "TradingApp/1.0 (contact@tradingapp.com)",
      },
    });
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    const pages = data?.query?.pages;
    
    if (pages) {
      for (const pageId of Object.keys(pages)) {
        const pageData = pages[pageId];
        if (pageData?.original?.source) {
          return pageData.original.source;
        }
      }
    }
    
    return null;
  } catch (error) {
    console.error(`Failed to fetch Wikipedia image for ${personName}:`, error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const ticker = searchParams.get("ticker");

  if (!ticker) {
    return NextResponse.json({ error: "Ticker is required" }, { status: 400 });
  }

  try {
    // Fetch congress trading data from AINvest API
    const apiUrl = `https://openapi.ainvest.com/open/ownership/congress?page=1&size=10&ticker=${ticker}`;
    console.log("Fetching congress data from:", apiUrl);
    
    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${AINVEST_API_KEY}`,
        "Content-Type": "application/json",
      },
    });

    const responseText = await response.text();
    console.log("Congress API response status:", response.status);
    console.log("Congress API response body:", responseText.substring(0, 500));

    if (!response.ok) {
      console.error("Congress API error response:", responseText);
      // Return empty data instead of throwing - API might just have no data
      return NextResponse.json({ data: [] });
    }

    let apiData: AInvestResponse;
    try {
      apiData = JSON.parse(responseText);
    } catch {
      console.error("Failed to parse Congress API response as JSON");
      return NextResponse.json({ data: [] });
    }
    
    if (apiData.status_code !== 0 || !apiData.data?.data) {
      return NextResponse.json({ data: [] });
    }

    const trades = apiData.data.data;
    
    // Fetch Wikipedia images for each unique congress member in parallel
    const uniqueNames = [...new Set(trades.map(trade => trade.name))];
    const imagePromises = uniqueNames.map(async (name) => {
      const imageUrl = await getWikipediaImage(name);
      return { name, imageUrl };
    });
    
    const imageResults = await Promise.all(imagePromises);
    const imageMap = new Map(imageResults.map(r => [r.name, r.imageUrl]));
    
    // Enrich trades with photo URLs
    const enrichedTrades = trades.map(trade => ({
      ...trade,
      photo_url: imageMap.get(trade.name) || null,
    }));

    return NextResponse.json({ data: enrichedTrades });
  } catch (error) {
    console.error("Congress API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch congress data" },
      { status: 500 }
    );
  }
}
