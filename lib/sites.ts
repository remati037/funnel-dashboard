import { CURRENCY, SiteConfig, devMode, sites, today } from "./config";
import { demoSite } from "./demo";

export type Step = {
  type: string; step_id: number; name: string; views: number; conversions: number; revenue: number;
  links?: Record<string, string>;
};
export type Funnel = { id: string; fid: number; name: string; edit_url?: string; steps: Step[] };
export type Site = { id: string; src: string; name: string; url: string; currency: string; rate: number; funnels: Funnel[] };

const TTL_OPEN = 15 * 60 * 1000; // period koji uključuje danas
const TTL_CLOSED = 6 * 60 * 60 * 1000; // zatvoren period
const cache = new Map<string, { t: number; ttl: number; data: Site }>();

/* Stari plugin (<= 0.4.0) ne šalje adresu za upsell/downsell/thank-you. Te stranice se u FunnelKitu otvaraju
   i bez porudžbine, a WordPress `?p=ID` preusmeri na pravu adresu – pa i njih možemo da uslikamo. */
const PAGE_TYPES = ["landing", "optin", "checkout", "upsell", "downsell", "thankyou"];
function withView(s: any, base: string): Record<string, string> {
  const links = { ...(s.links || {}) };
  const id = Number(s.step_id);
  if (!links.view && id > 0 && PAGE_TYPES.includes(s.type)) links.view = `${base}/?p=${id}`;
  return links;
}

function normalize(payload: any, cfg: SiteConfig, idx: number): Site {
  const sid = "s" + idx;
  const funnels: Funnel[] = (payload.funnels || []).map((f: any) => ({
    ...f,
    fid: Number(f.id),
    id: sid + "-" + f.id,
    steps: (f.steps || []).map((s: any) => ({
      ...s,
      revenue: Math.round(Number(s.revenue || 0) * cfg.rate * 100) / 100,
      links: withView(s, cfg.url),
    })),
  }));
  return {
    id: sid,
    src: cfg.url,
    name: cfg.name || new URL(cfg.url).hostname,
    url: String(payload.site?.url || cfg.url).replace(/^https?:\/\//, ""),
    currency: payload.site?.currency || "",
    rate: cfg.rate,
    funnels,
  };
}

/** Podaci jednog sajta za period (keširano). */
export async function fetchSite(src: string, from: string, to: string, refresh = false): Promise<Site> {
  const list = sites();
  const idx = list.findIndex((s) => s.url === src);
  if (idx < 0) throw new Error("Sajt više nije u listi sajtova.");
  const cfg = list[idx];
  const key = `${src}|${from}|${to}`;
  const hit = cache.get(key);
  if (!refresh && hit && Date.now() - hit.t < hit.ttl) return hit.data;

  const u = new URL(cfg.url + "/");
  u.searchParams.set("rest_route", "/fdash/v1/funnels");
  u.searchParams.set("from", from);
  u.searchParams.set("to", to);
  let res: Response;
  try {
    res = await fetch(u, { headers: { "X-FDash-Key": cfg.key, Accept: "application/json" }, cache: "no-store", signal: AbortSignal.timeout(30000) });
  } catch (e: any) {
    throw new Error("Sajt nije dostupan (" + (e?.name === "TimeoutError" ? "timeout" : e?.message || "greška") + ")");
  }
  let body: any = null;
  try { body = await res.json(); } catch { /* nije JSON */ }
  if (!res.ok || !body || !Array.isArray(body.funnels)) {
    let msg = body?.message || "HTTP " + res.status;
    if (res.status === 404) msg += " – plugin Funnel Dashboard verovatno nije aktivan na tom sajtu.";
    throw new Error(msg);
  }
  const data = normalize(body, cfg, idx);
  cache.set(key, { t: Date.now(), ttl: to >= today() ? TTL_OPEN : TTL_CLOSED, data });
  return data;
}

/** Svi sajtovi za period – paralelno. */
export async function aggregate(from: string, to: string, refresh = false) {
  const list = sites();
  if (!list.length && devMode()) {
    return { currency: CURRENCY, from, to, generated_at: new Date().toISOString(), cached: false, demo: true, sites: [demoSite()], errors: [] };
  }
  const results = await Promise.allSettled(list.map((s) => fetchSite(s.url, from, to, refresh)));
  const out = { currency: CURRENCY, from, to, generated_at: new Date().toISOString(), cached: false, sites: [] as Site[], errors: [] as { site: string; message: string }[] };
  results.forEach((r, i) => {
    if (r.status === "fulfilled") out.sites.push(r.value);
    else out.errors.push({ site: list[i].name || list[i].url, message: (r.reason as Error)?.message || "Greška" });
  });
  if (!list.length) out.errors.push({ site: "Dashboard", message: "Nema podešenih sajtova (FDASH_SITES)." });
  return out;
}
