import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import Navbar from "@/components/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Naval Predictions",
  description: "AI Powered Marine Machinery Oil Analyzing System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased relative min-h-screen`}
        suppressHydrationWarning
      >
        {/* Global Background Image */}
        <div className="fixed inset-0 z-[-1]">
          <img
            src="/Navy1.jpg"
            alt="Navy Background"
            className="w-full h-full object-cover blur-sm scale-105"
          />
          <div className="absolute inset-0 bg-white/30 dark:bg-black/40" />
        </div>

        <AuthProvider>
          <Navbar />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
