"use client";

import { useState, useEffect, useRef } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, limitToLast } from "firebase/firestore";
import { Mic, Volume2, VolumeX, Send, Brain, Shield, Zap, Copy, CheckCircle2, Clock, X, AlertTriangle, Activity, FileText } from "lucide-react";
import { useJarvisVoice } from "@/hooks/useJarvisVoice";
import MemoryBank from "@/components/MemoryBank";

// --- CORE INTELLIGENCE: Domain & Safety Logic ---
const getMessageIntent = (content: string) => {
  if (content.includes("```")) return "CODE";
  const medicalTriggers = [
    "hypertension", "extraction", "anesthesia", "systolic", "diastolic", 
    "mepivacaine", "epinephrine", "diagnosis", "pathology", "treatment plan", "caries", "molar"
  ];
  const lowerContent = content.toLowerCase();
  const isMedical = medicalTriggers.some(t => lowerContent.includes(t));
  const isPatientAction = lowerContent.includes("patient") && (lowerContent.includes("add") || lowerContent.includes("record") || lowerContent.includes("history"));

  return (isMedical || isPatientAction) ? "CLINICAL" : "CHAT";
};

const getSafetyLevel = (content: string) => {
  const highRisk = ["190/110", "180/110", "uncontrolled", "crisis", "contraindicated"];
  return highRisk.some(term => content.toLowerCase().includes(term)) ? "CRITICAL" : "STABLE";
};

export default function JarvisChat() {
  const [mounted, setMounted] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [schedule, setSchedule] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const [memories, setMemories] = useState<any[]>([]);
  const [isMemoryOpen, setIsMemoryOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false); // Neural Sync state
  const [syncMessage, setSyncMessage] = useState(""); // Sync Toast text
  const scrollRef = useRef<HTMLDivElement>(null);

  // --- REPORT GENERATION ENGINE ---
  const handleExport = (content: string) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>YOUSCO_OS | Case Report</title>
            <style>
              body { font-family: 'Inter', sans-serif; padding: 50px; color: #1a1a1a; line-height: 1.6; }
              .header { border-bottom: 3px solid #3b82f6; padding-bottom: 20px; margin-bottom: 30px; }
              .univ { font-size: 12px; font-weight: bold; color: #3b82f6; text-transform: uppercase; margin-bottom: 5px; }
              .title { font-size: 24px; margin: 0; }
              .label { font-weight: bold; text-transform: uppercase; font-size: 11px; color: #666; margin-top: 20px; display: block; }
              .content { margin-top: 10px; white-space: pre-wrap; background: #f9fafb; padding: 20px; border-radius: 8px; border: 1px solid #eee; }
              .footer { font-size: 10px; color: #999; margin-top: 60px; border-top: 1px solid #eee; padding-top: 15px; text-align: center; }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="univ">Alexandria University | Faculty of Dentistry</div>
              <h1 class="title">CLINICAL CASE SUMMARY</h1>
            </div>
            <span class="label">System Timestamp:</span>
            <p style="font-size: 12px;">${new Date().toLocaleString()}</p>
            <span class="label">Consultation Records:</span>
            <div class="content">${content}</div>
            <div class="footer">Generated via YOUSCO OS Intelligence Protocol. Confidential Clinical Data.</div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  useEffect(() => {
    setMounted(true);
    // 🛡️ FIX: Changed 'limit(50)' to 'limitToLast(50)' to ensure new messages always show
    const qM = query(collection(db, "messages"), orderBy("createdAt", "asc"), limitToLast(50));
    const unsubM = onSnapshot(qM, (s) => setMessages(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubMem = onSnapshot(query(collection(db, "memories"), orderBy("createdAt", "desc")), (s) => setMemories(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubSched = onSnapshot(query(collection(db, "schedule"), orderBy("createdAt", "asc")), (s) => setSchedule(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => { unsubM(); unsubMem(); unsubSched(); };
  }, []);

  const { speak, startListening, isListening } = useJarvisVoice((t) => setInput(t));

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userQuery = input;
    setInput("");
    setIsLoading(true);

    const tempUserMsg = { role: "user", content: userQuery, createdAt: new Date() };
    
    // We remove the manual 'setMessages' here because 'onSnapshot' 
    // will pick up the Firebase addition instantly.

    try {
      await addDoc(collection(db, "messages"), { ...tempUserMsg, createdAt: serverTimestamp() });

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          // 🛡️ Fix for the 400 Interference error: strip non-AI properties
          messages: [...messages, tempUserMsg].map(m => ({ role: m.role, content: m.content })), 
          memories, 
          schedule 
        }),
      });

      const data = await response.json(); 

      if (data?.content) {
        const jarvisMsg = { role: "assistant", content: data.content, createdAt: new Date() };
        await addDoc(collection(db, "messages"), { ...jarvisMsg, createdAt: serverTimestamp() });

        if (data.memoryUpdate) {
          setIsSyncing(true);
          setSyncMessage(data.memoryUpdate);
          
          await addDoc(collection(db, "memories"), {
            text: data.memoryUpdate,
            type: "knowledge",
            createdAt: serverTimestamp()
          });

          setTimeout(() => {
            setIsSyncing(false);
            setSyncMessage("");
          }, 3000);
        }

        if (isVoiceEnabled) speak(data.content);
      }
    } catch (err) { 
      console.error("Uplink Error:", err); 
    } finally { 
      setIsLoading(false); 
    }
  };

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  if (!mounted) return null;

  return (
    <div className="flex flex-col h-screen bg-[#0a0a0a] text-slate-100 font-sans relative overflow-hidden">
      
      {/* Sync Toast Notification */}
      {isSyncing && (
        <div className="absolute top-20 right-6 z-[60] flex items-center gap-3 bg-blue-600/20 border border-blue-500/40 backdrop-blur-md px-4 py-2 rounded-xl animate-in slide-in-from-right fade-in duration-300">
          <div className="bg-blue-500 p-1 rounded-full animate-pulse">
            <CheckCircle2 size={12} className="text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-blue-400 uppercase tracking-tighter font-mono">NEURAL_SYNC_ACTIVE</span>
            <span className="text-[11px] text-white/80 font-light truncate max-w-[200px]">{syncMessage}</span>
          </div>
        </div>
      )}

      {/* Dynamic Header */}
      <header className="px-6 py-4 border-b border-white/5 bg-black/60 backdrop-blur-xl flex justify-between items-center z-50">
        <div className="flex items-center gap-3">
          <Shield size={16} className={isListening ? "text-red-500 animate-pulse" : "text-blue-500"} />
          <span className="text-[10px] font-mono text-blue-400 uppercase tracking-widest font-bold">YOUSCO_OS v2.5</span>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => setIsVoiceEnabled(!isVoiceEnabled)}>{isVoiceEnabled ? <Volume2 size={18} /> : <VolumeX size={18} className="text-red-500" />}</button>
          
          <button 
            onClick={() => setIsMemoryOpen(true)} 
            className={`relative flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all duration-700 text-[10px] font-mono ${
              isSyncing 
                ? "bg-blue-500/20 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]" 
                : "border-white/10 hover:bg-white/5"
            }`}
          >
            <Brain size={14} className={isSyncing ? "text-blue-400 animate-pulse" : ""} /> 
            RECORDS
            {isSyncing && (
              <span className="absolute -top-1 -right-1 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Primary Message Stream */}
      <main ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-8 pb-40 scroll-smooth">
        {messages.map((m, idx) => {
          const intent = getMessageIntent(m.content);
          const safety = getSafetyLevel(m.content);

          return (
            <div key={m.id || `msg-${idx}`} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`group relative max-w-[85%] md:max-w-[70%] p-5 rounded-2xl transition-all duration-500 ${
                m.role === "user" 
                  ? "bg-blue-600/5 border border-blue-500/20" 
                  : intent === "CLINICAL"
                    ? "bg-emerald-500/5 border border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.05)]"
                    : "bg-[#111] border border-white/5 shadow-2xl"
              }`}>
                
                {safety === "CRITICAL" && m.role === "assistant" && (
                  <div className="mb-4 flex items-center gap-2 text-[10px] bg-red-500/10 border border-red-500/30 text-red-500 px-3 py-2 rounded-lg font-bold animate-pulse">
                    <AlertTriangle size={14} /> CLINICAL_RISK_ADVISORY
                  </div>
                )}

                <div className="flex items-center gap-2 mb-3">
                  <p className="text-[9px] opacity-40 font-mono uppercase tracking-[0.2em]">{m.role === "user" ? "YOUSSEF" : "JARVIS"}</p>
                  {m.role === "assistant" && (
                    <span className={`text-[8px] px-1.5 py-0.5 rounded border ${intent === "CLINICAL" ? "border-emerald-500/30 text-emerald-500" : "border-blue-500/30 text-blue-500"}`}>
                      {intent}
                    </span>
                  )}
                </div>

                <div className={`text-sm font-light leading-relaxed whitespace-pre-wrap ${intent === "CODE" ? "font-mono bg-black/40 p-4 rounded-lg border border-white/5" : ""}`}>
                  {m.content}
                </div>

                {intent === "CLINICAL" && m.role === "assistant" && (
                  <button 
                    onClick={() => handleExport(m.content)}
                    className="mt-4 flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded text-[9px] text-emerald-500 transition-all font-mono"
                  >
                    <FileText size={12} /> GENERATE_UNIVERSITY_REPORT
                  </button>
                )}
              </div>
            </div>
          );
        })}
        {isLoading && <div className="text-[10px] font-mono text-blue-500 animate-pulse">UPLINKING...</div>}
      </main>

      {/* Input Module */}
      <footer className="absolute bottom-0 left-0 w-full p-8 bg-gradient-to-t from-black via-black/90 to-transparent z-40">
        <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto flex gap-4 items-center bg-[#161616]/80 border border-white/10 p-2 rounded-2xl backdrop-blur-3xl focus-within:border-blue-500/40 shadow-2xl transition-all">
          <button type="button" onClick={startListening} className={`p-4 rounded-xl transition-all ${isListening ? "text-red-500" : "text-slate-500 hover:text-blue-400"}`}>
            <Mic size={20} className={isListening ? "animate-pulse" : ""} />
          </button>
          <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Awaiting command..." className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-mono text-white py-3" />
          <button type="submit" disabled={isLoading || !input.trim()} className="p-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl disabled:opacity-20 shadow-lg shadow-blue-600/20 transition-all">
            <Send size={18} />
          </button>
        </form>
      </footer>

      <MemoryBank memories={memories} isOpen={isMemoryOpen} onClose={() => setIsMemoryOpen(false)} />
    </div>
  );
}