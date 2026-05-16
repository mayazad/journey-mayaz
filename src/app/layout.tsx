import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Mayaz OS",
    template: "%s | Mayaz OS",
  },
  description:
    "A personal operating system for tracking learning roadmaps, fitness routines, academic deadlines, and private metadata.",
  keywords: ["productivity", "learning", "fitness", "academics", "personal OS"],
  authors: [{ name: "Mayaz OS" }],
  openGraph: {
    type: "website",
    title: "Life OS",
    description: "Your personal operating system.",
    siteName: "Life OS",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} h-full`}
    >
      <body className="h-full antialiased">{children}</body>
    </html>
  );
}
