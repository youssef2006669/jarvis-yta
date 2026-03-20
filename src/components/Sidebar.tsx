"use client";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot, limit } from "firebase/firestore";
import { Brain, CheckSquare, Zap, Shield } from "lucide-react";

export default function Sidebar() {
  const [memories, setMemories] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);

  useEffect(() => {
    const qM = query(collection(db, "memories"), orderBy("createdAt", "desc"), limit(6));
    const qT = query(collection(db, "tasks"), orderBy("createdAt", "desc"), limit(8));
    
    const unsubM = onSnapshot(qM, (s) => setMemories(s.docs.map(d => ({id: d.id, ...d.data()}))));
    const unsubT = onSnapshot(qT, (s) => setTasks(s.docs.map(d => ({id: d.id, ...d.data()}))));
    
    return () => { unsubM(); unsubT(); };
  }, []);

  return (
    <aside className="w-80 bg-[#0a0a0a] border-r border-blue-900/20 p-6 flex flex-col h-full hidden xl:flex">
      <div className="flex items-center gap-3 mb-12">
        <Shield className="text-blue-500 animate-pulse" size={24} />
        <h2 className="text-xs font-mono font-bold tracking-[0.4em] text-blue-400 uppercase">
          Core Systems
        </h2>
      </div>
      
      <div className="space-y-12">
        <section>
          <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-5 flex items-center gap-2">
            <Brain size={14} className="text-blue-500" /> Cognitive Logs
          </h3>
          <div className="space-y-3">
            {memories.map(m => (
              <div key={m.id} className="text-[11px] bg-blue-950/20 border border-blue-500/10 p-3 rounded-md text-slate-400 font-mono leading-relaxed">
                {m.content}
              </div>
            ))}
          </div>
        </section>

        <section>
          <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-5 flex items-center gap-2">
            <CheckSquare size={14} className="text-cyan-400" /> Active Protocols
          </h3>
          <div className="space-y-3 text-[11px] text-slate-400 font-mono">
            {tasks.map(t => (
              <div key={t.id} className="flex items-center gap-3 group cursor-pointer">
                <Zap size={10} className="text-blue-600 group-hover:text-blue-400" /> 
                <span className="group-hover:translate-x-1 transition-transform">{t.title}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
      
      <div className="mt-auto pt-6 border-t border-blue-900/10 text-[9px] font-mono text-blue-900/60 uppercase tracking-widest">
        System Status: Optimal
      </div>
    </aside>
  );
}