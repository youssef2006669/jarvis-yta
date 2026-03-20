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
    const body = await req.json();
    
    // Ensure 'messages' exists (even if the Watch sends a simple string)
    const messages = body.messages || [{ role: "user", content: body.content || "Report status." }];

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
        ...messages,
      ],
    });

    const content = response.choices[0].message.content;

    // --- UNIVERSAL RESPONSE WITH CORS ---
    return new NextResponse(JSON.stringify({ content }), {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Content-Type": "application/json",
      },
    });

  } catch (error: any) {
    console.error("❌ JARVIS CORE ERROR:", error.message);
    return new NextResponse(JSON.stringify({ 
      content: "Sir, satellite interference detected in the Alexandria sector. Re-sync required." 
    }), { 
      status: 200, // Forces the Watch to show the error text instead of 'API Error'
      headers: { "Access-Control-Allow-Origin": "*" } 
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




