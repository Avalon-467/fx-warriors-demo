import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: 'FX Warriors — Research Chat',
  description: 'Ask about currencies, see charts and search the evidence in one conversation.',
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
