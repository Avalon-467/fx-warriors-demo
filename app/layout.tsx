import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: 'FX Warriors — AI Forecast Analyst',
  description: 'Traditional FX models, real LLM tool calls and transparent policy evidence.',
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
