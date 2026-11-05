import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: 'FX Warriors — AI6101 Mini-Project',
  description: 'An AI6101 student team project combining conversational AI, web research and traditional foreign-exchange models. Explore charts and cited sources with FX Warriors.',
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
