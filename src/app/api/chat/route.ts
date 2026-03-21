import { NextResponse } from "next/server";
import OpenAI from "openai";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const groq = new OpenAI({ apiKey: process.env.GROQ_API_KEY, baseURL: "https://api.groq.com/openai/v1" });

export async function POST(req: Request) {
  try {
    const { messages, memories } = await req.json();

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
        ...messages.slice(-10),
      ],
      response_format: { type: "json_object" },
    });
// Add the fallback "" (empty string) to satisfy the type checker
const data = JSON.parse(response.choices[0].message.content || "{}");

    return new NextResponse(JSON.stringify(data), {
      status: 200,
      headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new NextResponse(JSON.stringify({ content: `Sir, interference: ${error.message}` }), { status: 200 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" },
  });
}