"use client";
import React from 'react';
import { Brain, X, ShieldCheck, Zap, Calendar } from 'lucide-react';

interface Memory {
  id: string;
  content: string;
  category?: string;
}

export default function MemoryBank({ memories, isOpen, onClose }: { memories: Memory[], isOpen: boolean, onClose: () => void }) {
  if (!isOpen) return null;

  // Separate schedule items from general memories
  const scheduleItems = memories.filter(m => m.category === "Schedule");
  const generalRecords = memories.filter(m => m.category !== "Schedule");

  return (
    <div className="fixed inset-y-0 right-0 w-80 bg-slate-950/90 border-l border-blue-500/20 backdrop-blur-2xl z-[100] p-6 shadow-[-20px_0_50px_rgba(0,0,0,0.8)] flex flex-col animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2">
          <Brain className="text-blue-400 animate-pulse" size={18} />
          <h2 className="text-blue-100 font-mono font-bold tracking-widest uppercase text-[10px]">Neural Bank</h2>
        </div>
        <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
          <X size={18} />
        </button>
      </div>

      {/* Agenda Section */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3 text-blue-500">
          <Calendar size={12} />
          <span className="text-[9px] font-mono uppercase tracking-[0.2em]">Upcoming Agenda</span>
        </div>
        <div className="space-y-2">
          {scheduleItems.length === 0 ? (
            <p className="text-[10px] text-slate-600 font-mono italic px-2">No pending tasks for tomorrow...</p>
          ) : (
            scheduleItems.map((item) => (
              <div key={item.id} className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/10 text-[11px] font-mono text-blue-200">
                <span className="text-blue-500 mr-2">▶</span> {item.content}
              </div>
            ))
          )}
        </div>
      </div>

      {/* General Records Section */}
      <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-2">
        <div className="flex items-center gap-2 mb-1">
           <Zap size={10} className="text-slate-500" />
           <span className="text-[9px] text-slate-500 font-mono uppercase tracking-widest">Knowledge Base</span>
        </div>
        {generalRecords.map((mem) => (
          <div key={mem.id} className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 hover:border-blue-500/30 transition-all group relative overflow-hidden">
            <p className="text-xs text-slate-300 leading-relaxed font-mono italic">"{mem.content}"</p>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
        <span className="text-[9px] text-slate-600 font-mono uppercase">Yousco Industries</span>
        <ShieldCheck size={14} className="text-green-500/30" />
      </div>
    </div>
  );
}