import { NextResponse } from "next/server";
import OpenAI from "openai";

// src/app/api/chat/route.ts

const apiKey = process.env.GROQ_API_KEY;

if (!apiKey) {
  console.error("GROQ_API_KEY is missing from environment variables.");
}

const groq = new OpenAI({ 
  apiKey: apiKey || "", 
  baseURL: "https://api.groq.com/openai/v1" // Ensure NO trailing slash here
});

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `You are JARVIS-YTA. Respond in JSON format only.
          
          STRUCTURE:
          {
            "content": "Your verbal response to Youssef",
            "memoryUpdate": "A short fact to save to his Neural Bank (null if nothing new)",
            "intent": "CLINICAL" | "DEV" | "GENERAL"
          }

          INSTRUCTIONS:
          - If Youssef shares a dental patient detail, code preference, or personal fact, extract it into "memoryUpdate".
          - Address him as Youssef. Location: Alexandria.`
        },
        ...(messages || []),
      ],
      response_format: { type: "json_object" },
    });

    // 🛡️ NETLIFY BUILD FIX: Fallback to "{}" if content is null
    const rawContent = response.choices[0].message.content || "{}";
    const data = JSON.parse(rawContent);

    return new NextResponse(JSON.stringify(data), {
      status: 200,
      headers: { 
        "Access-Control-Allow-Origin": "*", 
        "Content-Type": "application/json" 
      },
    });
  } catch (error: any) {
    console.error("Uplink Error:", error);
    return new NextResponse(JSON.stringify({ 
      content: `Sir, interference: ${error.message}`,
      intent: "GENERAL" 
    }), { status: 200 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: { 
      "Access-Control-Allow-Origin": "*", 
      "Access-Control-Allow-Methods": "POST, OPTIONS", 
      "Access-Control-Allow-Headers": "Content-Type" 
    },
  });
}