import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";

const geistMono = Geist_Mono({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Yousco OS | JARVIS-YTA",
  description: "Advanced AI Assistant for Yousco Industries",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className={`${geistMono.className} bg-slate-950 text-slate-100 h-screen flex flex-col overflow-hidden`}>
        
        {/* 1. The Header: Fixed height */}
        <Header />
        
        {/* 2. The Main Content: Flex-1 fills the gap, overflow-hidden prevents page scrolling */}
        <main className="flex-1 flex flex-col min-h-0 relative overflow-hidden">
          {children}
        </main>

      </body>
    </html>
  );
}