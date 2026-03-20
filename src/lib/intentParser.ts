export const parseIntent = (content: string) => {
  const hasCode = content.includes("```");
  const isTask = content.toLowerCase().includes("task:") || content.toLowerCase().includes("todo:");
  const isUrgent = content.toLowerCase().includes("urgent") || content.toLowerCase().includes("immediately");

  return {
    type: hasCode ? "DEVELOPMENT" : isTask ? "ACTION" : "CHAT",
    priority: isUrgent ? "HIGH" : "NORMAL",
    hasCode
  };
};