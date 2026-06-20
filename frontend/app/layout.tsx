import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Battleship API Console",
  description: "A local test harness for the Battleship game backend",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
