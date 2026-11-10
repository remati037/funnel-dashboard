import { createHash } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import { devMode, sites } from "./config";
import { DEMO_HOSTS } from "./demo";
import { supabaseServer } from "./supabase";

/**
 * Screenshotovi pravih stranica funnela.
 * Lokalno: `puppeteer` (sa svojim Chrome-om). Na Vercelu: `puppeteer-core` + `@sparticuz/chromium`.
 * Čuvanje: Supabase Storage (bucket `shots`, trajno, deljeno za ceo tim). Lokalno i kao rezerva: disk
 * (`.cache/shots`, na Vercelu `/tmp`). Slika se pravi samo prvi put i na „Osveži”.
 */
const VIEW = { width: 1280, height: 860 };
const BUCKET = "shots";
const DIR = process.env.VERCEL ? "/tmp/fdash-shots" : path.join(process.cwd(), ".cache", "shots");
const MAX_PAGES = 3;

const hash = (url: string) => createHash("sha1").update(url).digest("hex");

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

/* ---------- skladište: Supabase Storage (trajno) ili disk (lokalno / rezerva) ---------- */
type Obj = { body: Buffer; type: string };
interface Store {
  get(key: string): Promise<Obj | null>;
  put(key: string, o: Obj): Promise<void>;
  del(key: string): Promise<void>;
}

const diskStore: Store = {
  async get(key) {
    const f = path.join(DIR, key);
    try {
      const body = await fs.readFile(f);
      let type = "image/jpeg";
      try { type = JSON.parse(await fs.readFile(f + ".json", "utf8")).type || type; } catch { /* auto slika */ }
      return { body, type };
    } catch { return null; }
  },
  async put(key, o) {
    const f = path.join(DIR, key);
    await fs.mkdir(path.dirname(f), { recursive: true });
    await fs.writeFile(f, o.body);
    await fs.writeFile(f + ".json", JSON.stringify({ type: o.type, at: new Date().toISOString() }));
  },
  async del(key) {
    const f = path.join(DIR, key);
    await fs.rm(f, { force: true });
    await fs.rm(f + ".json", { force: true });
  },
};

let storageBroken = false; // bucket ne postoji / nema prava → do restarta koristimo disk
async function cloudStore(): Promise<Store | null> {
  if (devMode() || storageBroken) return null;
  const sb = await supabaseServer();
  if (!sb) return null;
  const b = sb.storage.from(BUCKET);
  const broken = (e: any) => {
    const m = String(e?.message || e || "");
    if (/bucket not found|row-level security|unauthorized|not allowed/i.test(m)) {
      storageBroken = true;
      console.warn("[shots] Supabase Storage nije podešen (" + m + ") – slike idu na disk. Pokreni supabase.sql.");
    }
  };
  return {
    async get(key) {
      const { data, error } = await b.download(key);
      if (error || !data) { if (error && !/not found|object not found/i.test(String(error.message))) broken(error); return null; }
      return { body: Buffer.from(await data.arrayBuffer()), type: data.type || "image/jpeg" };
    },
    async put(key, o) {
      const { error } = await b.upload(key, o.body, { contentType: o.type, upsert: true, cacheControl: "3600" });
      if (error) { broken(error); await diskStore.put(key, o); }
    },
    async del(key) {
      const { error } = await b.remove([key]);
      if (error) broken(error);
      await diskStore.del(key);
    },
  };
}

/** Čita iz oblaka, a ako tamo nema (ili nije podešen) – sa diska. */
async function read(key: string): Promise<Obj | null> {
  const c = await cloudStore();
  return (c && (await c.get(key))) || (await diskStore.get(key));
}
async function write(key: string, o: Obj) {
  const c = await cloudStore();
  await (c || diskStore).put(key, o);
}

const autoKey = (url: string) => `auto/${hash(url)}.jpg`;
const manualKey = (url: string) => `manual/${hash(url)}`;

/**
 * Slika stranice: ručna ako postoji, inače sačuvana automatska.
 * Nova se pravi SAMO kad slike još nema ili kad je tražen refresh – nema više isteka posle 24h.
 */
export async function getShot(url: string, refresh = false): Promise<{ body: Buffer; type: string; manual: boolean; fresh: boolean }> {
  const [manual, auto] = await Promise.all([read(manualKey(url)), refresh ? null : read(autoKey(url))]);
  if (manual) return { ...manual, manual: true, fresh: false };
  if (auto) return { ...auto, manual: false, fresh: false };

  let p = inflight.get(url);
  if (!p) {
    p = capture(url).finally(() => inflight.delete(url));
    inflight.set(url, p);
  }
  const body = await p;
  await write(autoKey(url), { body, type: "image/jpeg" }).catch((e) => console.warn("[shots] čuvanje nije uspelo:", e?.message));
  return { body, type: "image/jpeg", manual: false, fresh: true };
}

export async function saveManual(url: string, body: Buffer, type: string) {
  await write(manualKey(url), { body, type });
}

export async function removeManual(url: string) {
  const c = await cloudStore();
  await (c || diskStore).del(manualKey(url));
}
