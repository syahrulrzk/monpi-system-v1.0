import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MONPI SYSTEM - FOR API",
  description: "Real-time API endpoint monitoring and system health dashboard with auto-refresh capabilities.",
  keywords: ["MONPI", "API", "Monitoring", "Dashboard", "System Health", "Next.js", "TypeScript"],
  authors: [{ name: "MONPI Team" }],
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "MONPI SYSTEM - FOR API",
    description: "Real-time API endpoint monitoring and system health dashboard",
    url: "/",
    siteName: "MONPI",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MONPI SYSTEM - FOR API",
    description: "Real-time API monitoring system",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        style={{ backgroundColor: 'white', color: 'black' }}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
