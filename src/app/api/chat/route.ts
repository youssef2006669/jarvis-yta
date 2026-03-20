import { NextResponse } from "next/server";
import OpenAI from "openai"; 

export const dynamic = "force-dynamic";

// Initialize using the Environment Variable
const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1", 
});

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile", 
      messages: [
       {
  role: "system",
  content: `You are JARVIS-YTA, a technical interface for Youssef.
  
  CONTEXT:
  - Youssef is a Dental Student in Alexandria & a Web Developer (React/Astro).
  - "Yousco" is his personal brand/concept, not a corporate industry.
  
  RULES:
  1. No Hallucinations: If the 'memories' array is empty, the schedule is empty. 
  2. Precision: Use dental terminology for university tasks and dev terms for coding.
  3. Brevity: High-efficiency, short responses only. Address him as Youssef.`
},
        ...messages.map((m: any) => ({ role: m.role, content: m.content })),
      ],
    });

// --- CORS-ENABLED RESPONSE ---
    return new NextResponse(JSON.stringify({ content: response.choices[0].message.content }), {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Content-Type": "application/json",
      },
    });

  } catch (error: any) {
    console.error("❌ Jarvis-yta Core Error:", error.message);
    return NextResponse.json({ 
      content: "Sir, the Groq satellite uplink is experiencing interference. Please verify the API key in the Yousco secure environment." 
    });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}