"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, limit, deleteDoc, doc } from "firebase/firestore";
import { Mic, MicOff, Volume2, VolumeX, Send, Brain, Shield, Trash2, Zap, Copy, CheckCircle2, Calendar, Clock, X } from "lucide-react";
import { useJarvisVoice } from "@/hooks/useJarvisVoice";
import MemoryBank from "@/components/MemoryBank";

const getMessageIntent = (content: string) => {
  if (content.includes("```")) return "CODE";
  if (content.toLowerCase().includes("step") || content.match(/\d\./)) return "PROCEDURE";
  return "CHAT";
};

export default function JarvisChat() {
  const [mounted, setMounted] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [schedule, setSchedule] = useState<any[]>([]); // New Schedule State
  const [isLoading, setIsLoading] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const [memories, setMemories] = useState<any[]>([]);
  const [isMemoryOpen, setIsMemoryOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // --- TEMPORAL ENGINE: ADD TO SCHEDULE ---
  const addToSchedule = async (time: string, task: string) => {
    try {
      await addDoc(collection(db, "schedule"), {
        time,
        task,
        status: "pending",
        createdAt: serverTimestamp()
      });
      speak(`Timeline updated, Youssef. ${task} noted for ${time}.`);
    } catch (e) { console.error("Schedule Error:", e); }
  };

  const deleteScheduleItem = async (id: string) => {
    try { await deleteDoc(doc(db, "schedule", id)); } catch (e) { console.error(e); }
  };

  const processCommand = useCallback((text: string) => {
    const cmd = text.toLowerCase();
    
    // Voice Command: "Schedule [Task] at [Time]"
    if (cmd.includes("schedule")) {
      const parts = cmd.split("at");
      const task = parts[0].replace("schedule", "").trim();
      const time = parts[1]?.trim() || "ASAP";
      if (task) {
        addToSchedule(time, task);
        return true;
      }
    }

    if (cmd.includes("system reset") || cmd.includes("clear logs")) {
      setMessages([]);
      speak("System logs purged.");
      return true;
    }
    
    if (cmd.includes("open records")) { setIsMemoryOpen(true); return true; }
    if (cmd.includes("close records")) { setIsMemoryOpen(false); return true; }

    return false; 
  }, []);

  useEffect(() => {
    setMounted(true);
    // Messages Listener
    const qM = query(collection(db, "messages"), orderBy("createdAt", "asc"), limit(50));
    const unsubM = onSnapshot(qM, (s) => setMessages(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    
    // Memories Listener
    const qMem = query(collection(db, "memories"), orderBy("createdAt", "desc"));
    const unsubMem = onSnapshot(qMem, (s) => setMemories(s.docs.map(d => ({ id: d.id, ...d.data() }))));

    // Schedule Listener
    const qSched = query(collection(db, "schedule"), orderBy("createdAt", "asc"));
    const unsubSched = onSnapshot(qSched, (s) => setSchedule(s.docs.map(d => ({ id: d.id, ...d.data() }))));

    return () => { unsubM(); unsubMem(); unsubSched(); };
  }, []);

  const { speak, startListening, isListening } = useJarvisVoice((transcript) => {
    const isCmd = processCommand(transcript);
    if (!isCmd) setInput(transcript);
  });

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userQuery = input;
    setInput("");
    setIsLoading(true);

    try {
      await addDoc(collection(db, "messages"), { role: "user", content: userQuery, createdAt: serverTimestamp() });
      
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          messages: [...messages, { role: "user", content: userQuery }], 
          memories,
          schedule, // Pass current schedule to the AI
          mode: "advanced"
        }),
      });
      const data = await response.json();
      await addDoc(collection(db, "messages"), { role: "assistant", content: data.content, createdAt: serverTimestamp() });
      if (isVoiceEnabled) speak(data.content);
    } catch (error) { console.error("API Error:", error); } finally { setIsLoading(false); }
  };

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  if (!mounted) return null;

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a] text-slate-100 font-sans relative overflow-hidden">
      
      {/* Header */}
      <div className="px-6 py-3 border-b border-slate-800/40 flex justify-between items-center bg-[#0d0d0d]/80 backdrop-blur-md z-20">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/20 bg-blue-500/5">
             <Shield size={12} className={isListening ? "text-red-500 animate-pulse" : "text-blue-500"} />
             <span className="text-[10px] font-mono text-blue-400 uppercase tracking-widest font-bold">YOUSCO OS V2.2</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setIsMemoryOpen(true)} className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-800 text-[10px] font-mono text-slate-400 hover:text-blue-400 transition-all"><Brain size={14} /> RECORDS</button>
          <button onClick={() => setIsVoiceEnabled(!isVoiceEnabled)} className="p-2">{isVoiceEnabled ? <Volume2 size={18} className="text-blue-400" /> : <VolumeX size={18} className="text-slate-500" />}</button>
        </div>
      </div>

      {/* NEW: Temporal Timeline UI */}
      <div className="px-6 py-2 bg-[#0c0c0c] border-b border-slate-800/30 flex items-center gap-4 overflow-x-auto no-scrollbar z-10">
        <div className="flex items-center gap-1.5 text-[9px] font-mono text-slate-500 uppercase flex-shrink-0">
          <Clock size={10} /> Timeline
        </div>
        {schedule.length > 0 ? (
          schedule.map((item) => (
            <div key={item.id} className="group flex items-center gap-2 bg-blue-500/5 border border-blue-500/10 px-2.5 py-1 rounded-md whitespace-nowrap">
              <span className="text-[10px] font-bold text-blue-400">{item.time}</span>
              <span className="text-[10px] text-slate-300">{item.task}</span>
              <button onClick={() => deleteScheduleItem(item.id)} className="opacity-0 group-hover:opacity-100 transition-opacity ml-1">
                <X size={10} className="text-slate-500 hover:text-red-400" />
              </button>
            </div>
          ))
        ) : (
          <span className="text-[10px] font-mono text-slate-700 italic">No scheduled objectives. Say "Schedule [task] at [time]" to start.</span>
        )}
      </div>

      {/* Message Stream */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-8 pb-40 scroll-smooth">
        {messages.map((m, idx) => {
          const intent = getMessageIntent(m.content);
          return (
            <div key={m.id || idx} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`group relative max-w-[90%] md:max-w-[75%] p-5 rounded-2xl transition-all duration-300 ${
                m.role === "user" 
                  ? "bg-blue-600/5 border border-blue-500/20 text-white rounded-tr-none" 
                  : "bg-[#111] border border-slate-800/80 rounded-tl-none shadow-xl"
              }`}>
                <div className="flex justify-between items-center mb-3">
                  <p className="text-[9px] opacity-40 font-mono uppercase tracking-[0.2em]">
                    {m.role === "user" ? "YOUSSEF" : "JARVIS"}
                  </p>
                  {m.role === "assistant" && intent === "CODE" && (
                    <button onClick={() => handleCopy(m.content, m.id)} className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400">
                      {copiedId === m.id ? <CheckCircle2 size={14} className="text-emerald-500" /> : <Copy size={14} />}
                    </button>
                  )}
                </div>
                <div className="text-sm font-light leading-relaxed whitespace-pre-wrap">{m.content}</div>
                {m.role === "assistant" && intent !== "CHAT" && (
                  <div className="mt-4 pt-4 border-t border-slate-800/50 flex gap-3 text-[10px] font-mono text-blue-500/70">
                    <Zap size={10} /> {intent === "CODE" ? "SYSTEM_CODE" : "SYSTEM_PROCEDURE"}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Input Module */}
      <div className="absolute bottom-0 left-0 w-full p-8 bg-gradient-to-t from-black via-black/95 to-transparent">
        <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto flex gap-4 items-center bg-[#161616] border border-slate-800/60 p-2 rounded-2xl backdrop-blur-3xl focus-within:border-blue-500/50 shadow-2xl">
          <button 
            type="button" 
            onClick={startListening} 
            className={`relative p-3 rounded-xl transition-all ${isListening ? "bg-red-500/20 text-red-500" : "text-slate-500 hover:text-blue-400"}`}
          >
            {isListening && <span className="absolute inset-0 rounded-xl bg-red-500/20 animate-ping"></span>}
            <Mic size={20} className="relative z-10" />
          </button>
          <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Awaiting command..." className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-mono text-white placeholder:text-slate-800 py-3" />
          <button type="submit" disabled={isLoading || !input.trim()} className="p-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all">
            <Send size={18} />
          </button>
        </form>
      </div>

      <MemoryBank memories={memories} isOpen={isMemoryOpen} onClose={() => setIsMemoryOpen(false)} />
    </div>
  );
}