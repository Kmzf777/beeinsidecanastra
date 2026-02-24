import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { PeriodProvider } from "@/lib/context/period-context";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Beeinside — Margem de Contribuição",
  description: "Plataforma de análise financeira e margem de contribuição para e-commerce",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <PeriodProvider>{children}</PeriodProvider>
      </body>
    </html>
  );
}
