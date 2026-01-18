import { NextRequest, NextResponse } from "next/server";

const AINVEST_API_KEY = "NSbP5VwkTjMKI62URz22AFAuONv7h4Dy";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const ticker = searchParams.get("ticker");

  if (!ticker) {
    return NextResponse.json({ error: "Ticker is required" }, { status: 400 });
  }

  try {
    const response = await fetch(
      `https://openapi.ainvest.com/open/ownership/congress?page=1&size=10&ticker=${ticker}`,
      {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${AINVEST_API_KEY}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Congress API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch congress data" },
      { status: 500 }
    );
  }
}
