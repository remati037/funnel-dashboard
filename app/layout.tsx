import type { Metadata } from "next";
import "./dashboard.css";
import { TITLE } from "@/lib/config";

export const metadata: Metadata = { title: TITLE, robots: { index: false, follow: false } };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sr">
      <body style={{ margin: 0, background: "#0e1116" }}>{children}</body>
    </html>
  );
}
