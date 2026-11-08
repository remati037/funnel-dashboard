import { createHash } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import { devMode, sites } from "./config";
import { DEMO_HOSTS } from "./demo";

/**
 * Screenshotovi pravih stranica funnela.
 * Lokalno: `puppeteer` (sa svojim Chrome-om). Na Vercelu: `puppeteer-core` + `@sparticuz/chromium`.
 * Keš: lokalno `.cache/shots`, na Vercelu `/tmp` (privremeno – za produkciju ide u Supabase Storage).
 */
const VIEW = { width: 1280, height: 860 };
const TTL = 24 * 60 * 60 * 1000;
const DIR = process.env.VERCEL ? "/tmp/fdash-shots" : path.join(process.cwd(), ".cache", "shots");
const MAX_PAGES = 3;

const hash = (url: string) => createHash("sha1").update(url).digest("hex");
const autoFile = (url: string) => path.join(DIR, hash(url) + ".jpg");
const manualFile = (url: string) => path.join(DIR, "m-" + hash(url));

/** Dozvoljene su samo adrese sa sajtova iz liste (i demo sajta lokalno). */
export function allowedUrl(raw: string | null): URL | null {
  if (!raw) return null;
  let u: URL;
  try { u = new URL(raw); } catch { return null; }
  if (!/^https?:$/.test(u.protocol)) return null;
  const hosts = sites().map((s) => new URL(s.url).hostname);
  if (devMode() && !hosts.length) hosts.push(...DEMO_HOSTS);
  const h = u.hostname.replace(/^www\./, "");
  return hosts.some((x) => x.replace(/^www\./, "") === h) ? u : null;
}

/* ---------- browser (jedan po procesu) ---------- */
let browserP: Promise<any> | null = null;
async function browser() {
  if (!browserP) {
    browserP = (async () => {
      if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
        const chromium = (await import("@sparticuz/chromium")).default;
        const pc = await import("puppeteer-core");
        return pc.launch({ args: chromium.args, executablePath: await chromium.executablePath(), headless: true, defaultViewport: VIEW });
      }
      const mod = "puppeteer"; // devDependency, samo lokalno
      const p = await import(/* webpackIgnore: true */ mod);
      return (p.default || p).launch({ headless: true, defaultViewport: VIEW });
    })();
    browserP.catch(() => { browserP = null; });
  }
  return browserP;
}

let active = 0;
const queue: (() => void)[] = [];
async function slot<T>(fn: () => Promise<T>): Promise<T> {
  if (active >= MAX_PAGES) await new Promise<void>((r) => queue.push(r));
  active++;
  try { return await fn(); } finally { active--; queue.shift()?.(); }
}

async function capture(url: string): Promise<Buffer> {
  const b = await browser();
  return slot(async () => {
    const page = await b.newPage();
    try {
      await page.setViewport(VIEW);
      try {
        await page.goto(url, { waitUntil: "networkidle2", timeout: 25000 });
      } catch {
        /* spore stranice: slikamo ono što se učitalo */
      }
      await new Promise((r) => setTimeout(r, 1200));
      // ukloni plutajuće elemente (chat, popupi, kolačići, "upravo je kupio") – zaglavlje ostaje
      await page.evaluate(() => {
        document.querySelectorAll<HTMLElement>("body *").forEach((el) => {
          const cs = getComputedStyle(el);
          if (cs.position !== "fixed" && cs.position !== "sticky") return;
          const r = el.getBoundingClientRect();
          const isHeader = r.top <= 1 && r.height < 160 && r.width > innerWidth * 0.9;
          if (!isHeader) el.remove();
        });
        window.scrollTo(0, 0);
      });
      return Buffer.from(await page.screenshot({ type: "jpeg", quality: 70 }));
    } finally {
      await page.close().catch(() => {});
    }
  });
}

const inflight = new Map<string, Promise<Buffer>>();

/** Slika stranice: ručna ako postoji, inače automatska iz keša ili nova. */
export async function getShot(url: string, refresh = false): Promise<{ body: Buffer; type: string; manual: boolean }> {
  await fs.mkdir(DIR, { recursive: true });
  try {
    const meta = JSON.parse(await fs.readFile(manualFile(url) + ".json", "utf8"));
    return { body: await fs.readFile(manualFile(url)), type: meta.type, manual: true };
  } catch { /* nema ručne slike */ }

  const file = autoFile(url);
  if (!refresh) {
    try {
      const st = await fs.stat(file);
      if (Date.now() - st.mtimeMs < TTL) return { body: await fs.readFile(file), type: "image/jpeg", manual: false };
    } catch { /* nema u kešu */ }
  }
  let p = inflight.get(url);
  if (!p) {
    p = capture(url).finally(() => inflight.delete(url));
    inflight.set(url, p);
  }
  const body = await p;
  await fs.writeFile(file, body);
  return { body, type: "image/jpeg", manual: false };
}

export async function saveManual(url: string, body: Buffer, type: string) {
  await fs.mkdir(DIR, { recursive: true });
  await fs.writeFile(manualFile(url), body);
  await fs.writeFile(manualFile(url) + ".json", JSON.stringify({ type, at: new Date().toISOString() }));
}

export async function removeManual(url: string) {
  await fs.rm(manualFile(url), { force: true });
  await fs.rm(manualFile(url) + ".json", { force: true });
}
