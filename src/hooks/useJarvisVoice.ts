import { useState, useCallback } from "react";

export const useJarvisVoice = (onTranscript: (t: string) => void) => {
  const [isListening, setIsListening] = useState(false);

  const speak = (text: string) => {
    const utterance = new window.SpeechSynthesisUtterance(text);
    utterance.rate = 1.1;
    utterance.pitch = 0.9; // Lower pitch for a "Jarvis" feel
    window.speechSynthesis.speak(utterance);
  };

  const startListening = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      onTranscript(transcript);
    };

    recognition.start();
  }, [onTranscript]);

  return { speak, startListening, isListening };
};