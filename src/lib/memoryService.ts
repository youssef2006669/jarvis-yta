import { db } from "./firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export type MemoryCategory = "Professional" | "Academic" | "Personal" | "System";

export async function saveStructuredMemory(content: string, category: MemoryCategory = "Professional") {
  try {
    await addDoc(collection(db, "memories"), {
      content: content.trim(),
      category: category,
      timestamp: serverTimestamp(),
      owner: "CEO_YOUSCO"
    });
    return true;
  } catch (error) {
    console.error("Memory bank write error:", error);
    return false;
  }
}