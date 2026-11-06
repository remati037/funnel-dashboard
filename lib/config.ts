export type SiteConfig = { name: string; url: string; key: string; rate: number };

export const TZ = process.env.FDASH_TZ || "Europe/Belgrade";
export const CURRENCY = process.env.FDASH_CURRENCY || "EUR";
export const TITLE = process.env.FDASH_TITLE || "Funnel Dashboard";

/** Lista sajtova iz env varijable FDASH_SITES (JSON). Ključevi ostaju samo na serveru. */
export function sites(): SiteConfig[] {
  const raw = process.env.FDASH_SITES || "[]";
  let list: any[] = [];
  try {
    list = JSON.parse(raw);
  } catch {
    throw new Error("FDASH_SITES nije ispravan JSON.");
  }
  return (Array.isArray(list) ? list : [])
    .map((s) => ({
      name: String(s.name || ""),
      url: String(s.url || "").replace(/\/+$/, ""),
      key: String(s.key || ""),
      rate: Number(String(s.rate ?? 1).replace(",", ".")) > 0 ? Number(String(s.rate ?? 1).replace(",", ".")) : 1,
    }))
    .filter((s) => /^https?:\/\//i.test(s.url));
}

export const supabaseConfigured = () =>
  !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** Lokalni razvoj bez Supabase-a: bez prijave i sa memorijskom bazom. U produkciji je zabranjeno. */
export const devMode = () => !supabaseConfigured() && process.env.NODE_ENV !== "production";

/* ---------- datumi (YYYY-MM-DD u vremenskoj zoni tima) ---------- */
export function today(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}
export function addDays(ymd: string, n: number): string {
  const d = new Date(ymd + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
export function diffDays(a: string, b: string): number {
  return Math.round((Date.parse(b + "T12:00:00Z") - Date.parse(a + "T12:00:00Z")) / 86400000);
}
export const isYmd = (s: any) => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);
