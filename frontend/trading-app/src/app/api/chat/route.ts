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