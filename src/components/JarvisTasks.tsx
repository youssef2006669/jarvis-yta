"use client";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase"; // Your firebase config file
import { collection, query, orderBy, onSnapshot, updateDoc, doc } from "firebase/firestore";

export default function JarvisTasks() {
  const [tasks, setTasks] = useState<any[]>([]);

  useEffect(() => {
    const q = query(collection(db, "jarvis_memory"), orderBy("timestamp", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  const completeTask = async (id: string) => {
    await updateDoc(doc(db, "jarvis_memory", id), { status: "completed" });
  };

  return (
    <div className="p-6 bg-black text-white border border-zinc-800 rounded-2xl">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <span className="text-blue-500">◈</span> JARVIS LOGS
      </h2>
      <div className="space-y-3">
        {tasks.map((task) => (
          <div key={task.id} className={`p-3 rounded-lg border ${task.status === 'completed' ? 'border-green-900/30 bg-green-900/10' : 'border-zinc-800 bg-zinc-900/50'}`}>
            <div className="flex justify-between items-start">
              <p className={task.status === 'completed' ? 'line-through text-zinc-500' : 'text-zinc-200'}>
                {task.task}
              </p>
              {task.status !== 'completed' && (
                <button onClick={() => completeTask(task.id)} className="text-xs bg-blue-600 px-2 py-1 rounded">Done</button>
              )}
            </div>
            <div className="mt-2 text-[10px] uppercase tracking-widest text-zinc-500 flex gap-3">
              <span>{task.category || "General"}</span>
              <span>{task.timestamp?.toDate().toLocaleTimeString()}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}