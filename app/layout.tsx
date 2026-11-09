import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./dashboard.css";
import { TITLE } from "@/lib/config";

const inter = Inter({ subsets: ["latin", "latin-ext"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = { title: TITLE, robots: { index: false, follow: false } };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sr" className={inter.variable}>
      <body style={{ margin: 0, background: "#F3F3F0" }}>{children}</body>
    </html>
  );
}
