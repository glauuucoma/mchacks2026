import { NextRequest, NextResponse } from "next/server";

interface StockContext {
  ticker?: string;
  name?: string;
  price?: number;
  change?: number;
  marketCap?: string;
  industry?: string;
}

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent";

export async function POST(request: NextRequest) {
  try {
    const { message, stockContext } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    if (!GEMINI_API_KEY) {
      // Return mock response if no API key
      return NextResponse.json({
        response: getMockResponse(message, stockContext),
        isMock: true,
      });
    }

    const systemPrompt = `You are a helpful financial assistant specializing in stock market analysis. You are currently helping the user understand information about ${stockContext?.name || "a stock"} (${stockContext?.ticker || "unknown ticker"}).

Current stock data:
- Price: $${stockContext?.price || "N/A"}
- Change: ${stockContext?.change || "N/A"}%
- Market Cap: ${stockContext?.marketCap || "N/A"}
- Industry: ${stockContext?.industry || "N/A"}

Provide concise, helpful responses. Be factual and mention when you're giving opinions vs facts. Keep responses under 150 words unless more detail is specifically requested.

IMPORTANT: Use plain text only. Do not use markdown formatting, bullet points, bold text, or any special formatting characters. Write in simple, conversational plain text.`;

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: `${systemPrompt}\n\nUser question: ${message}` },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 4096,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Gemini API error:", error);
      return NextResponse.json(
        { error: "Failed to get AI response" },
        { status: 500 }
      );
    }

    const data = await response.json();
    console.log("Gemini API response:", JSON.stringify(data, null, 2));
    
    // Try multiple possible response structures
    let aiResponse = 
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      data.response?.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!aiResponse && data.candidates?.[0]?.content) {
      // Try to extract text from any parts array
      const parts = data.candidates[0].content.parts;
      if (Array.isArray(parts) && parts.length > 0) {
        aiResponse = parts.find(part => part.text)?.text;
      }
    }
    
    if (!aiResponse) {
      console.error("Could not extract response from:", data);
      aiResponse = "I couldn't generate a response. Please try again.";
    }

    return NextResponse.json({ response: aiResponse });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Mock responses when no API key is available
function getMockResponse(message: string, stockContext?: StockContext): string {
  const ticker = stockContext?.ticker || "this stock";
  const name = stockContext?.name || "the company";
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes("buy") || lowerMessage.includes("invest")) {
    return `Whether to buy ${ticker} depends on your investment goals, risk tolerance, and time horizon. ${name} is in the ${stockContext?.industry || "technology"} sector. Consider diversification and consult a financial advisor for personalized advice.`;
  }

  if (lowerMessage.includes("price") || lowerMessage.includes("worth")) {
    return `${ticker} is currently trading at $${stockContext?.price || "N/A"}. The stock has moved ${stockContext?.change || "N/A"}% today. Remember that past performance doesn't guarantee future results.`;
  }

  if (lowerMessage.includes("risk")) {
    return `Key risks for ${name} include market volatility, sector-specific challenges, and broader economic conditions. As with any investment, there's potential for both gains and losses.`;
  }

  if (lowerMessage.includes("competitor") || lowerMessage.includes("compare")) {
    return `${name} competes in the ${stockContext?.industry || "market"}. To make informed comparisons, consider metrics like P/E ratio, revenue growth, and market share alongside qualitative factors.`;
  }

  return `Thanks for your question about ${name} (${ticker}). Based on current market data, the stock is trading at $${stockContext?.price || "N/A"} with a ${stockContext?.change || "0"}% change today. Is there something specific you'd like to know about this stock?`;
}
