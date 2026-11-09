import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./dashboard.css";
import { TITLE } from "@/lib/config";

const inter = Inter({ subsets: ["latin", "latin-ext"], variable: "--font-inter", display: "swap" });

const THEME_SCRIPT = `try{var t=localStorage.getItem("fdash_theme");if(t!=="dark"&&t!=="light")t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";document.documentElement.setAttribute("data-theme",t)}catch(e){}`;

export const metadata: Metadata = { title: TITLE, robots: { index: false, follow: false } };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sr" className={inter.variable} suppressHydrationWarning>
      <head>
        {/* tema pre prvog prikaza (bez treptanja): sačuvan izbor ili tema sistema */}
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
