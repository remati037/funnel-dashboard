import { addDays, devMode, diffDays, isYmd, today } from "./config";
import { fetchSite } from "./sites";
import { supabaseServer } from "./supabase";

export type Change = {
  id: string; src: string; site_name: string; funnel_id: number; funnel_name: string;
  step_id: number; step_type: string; step_name: string; note: string; date: string; created: string; user: string;
};

const MAX_DAYS = 28;

/* ---------- skladište: Supabase (produkcija) ili memorija (lokalni razvoj) ---------- */
const g = globalThis as any;
g.__fdashMem = g.__fdashMem || [];
const mem: Change[] = g.__fdashMem;

const fromRow = (r: any): Change => ({
  id: r.id, src: r.src, site_name: r.site_name || "", funnel_id: Number(r.funnel_id), funnel_name: r.funnel_name || "",
  step_id: Number(r.step_id || 0), step_type: r.step_type || "", step_name: r.step_name || "", note: r.note,
  date: r.date, created: r.created_at, user: r.user_email || "",
});

export async function listChanges(): Promise<Change[]> {
  if (devMode()) return [...mem];
  const sb = await supabaseServer();
  const { data, error } = await sb!.from("changes").select("*").order("date", { ascending: false }).order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []).map(fromRow);
}

export async function addChange(input: any, userEmail: string): Promise<Change> {
  const clean = (v: any, n = 300) => String(v ?? "").replace(/[\u0000-\u001f]/g, " ").trim().slice(0, n);
  const row = {
    src: clean(input.src, 500),
    site_name: clean(input.site_name),
    funnel_id: Math.max(0, parseInt(input.funnel_id, 10) || 0),
    funnel_name: clean(input.funnel_name),
    step_id: Math.max(0, parseInt(input.step_id, 10) || 0),
    step_type: clean(input.step_type, 20).replace(/[^a-z]/g, ""),
    step_name: clean(input.step_name),
    note: String(input.note ?? "").trim().slice(0, 2000),
    date: isYmd(input.date) && input.date <= today() ? input.date : today(),
    user_email: userEmail,
  };
  if (!row.funnel_id || !row.note || !/^https?:\/\//.test(row.src)) throw new Error("Nedostaje funnel, sajt ili opis izmene.");
  if (devMode()) {
    const c: Change = { ...row, id: crypto.randomUUID(), created: new Date().toISOString(), user: userEmail } as any;
    mem.unshift(c);
    return c;
  }
  const sb = await supabaseServer();
  const { data, error } = await sb!.from("changes").insert(row).select().single();
  if (error) throw new Error(error.message);
  return fromRow(data);
}

export async function deleteChange(id: string) {
  if (devMode()) {
    const i = mem.findIndex((c) => c.id === id);
    if (i >= 0) mem.splice(i, 1);
    return true;
  }
  const sb = await supabaseServer();
  const { error } = await sb!.from("changes").delete().eq("id", id);
  if (error) throw new Error(error.message);
  return true;
}

/* ---------- merenje pre/posle ----------
 * Isti broj dana PRE i POSLE dana izmene (do 28), sam dan izmene se preskače. */
async function windowStats(c: Change, from: string, to: string) {
  const site = await fetchSite(c.src, from, to);
  const step = { views: 0, conversions: 0, revenue: 0 };
  const funnel = { revenue: 0, orders: 0, entry: 0 };
  for (const f of site.funnels) {
    if (f.fid !== c.funnel_id) continue;
    funnel.entry = Number(f.steps[0]?.views || 0);
    for (const s of f.steps) {
      funnel.revenue += Number(s.revenue || 0);
      if (s.type === "checkout") funnel.orders += Number(s.conversions || 0);
      if (c.step_id && Number(s.step_id) === c.step_id) {
        step.views = Number(s.views || 0); step.conversions = Number(s.conversions || 0); step.revenue = Number(s.revenue || 0);
      }
    }
  }
  funnel.revenue = Math.round(funnel.revenue * 100) / 100;
  return { step, funnel };
}

async function measure(c: Change) {
  const elapsed = diffDays(c.date, today());
  if (elapsed < 1) return { status: "pending", window_days: 0, days_elapsed: Math.max(0, elapsed) };
  const len = Math.min(MAX_DAYS, elapsed);
  const b = { from: addDays(c.date, -len), to: addDays(c.date, -1) };
  const a = { from: addDays(c.date, 1), to: addDays(c.date, len) };
  try {
    const [before, after] = await Promise.all([windowStats(c, b.from, b.to), windowStats(c, a.from, a.to)]);
    return { status: "ok", window_days: len, days_elapsed: elapsed, before: { ...b, ...before }, after: { ...a, ...after } };
  } catch (e: any) {
    return { status: "error", message: e?.message || "Greška" };
  }
}

export async function changesWithResults() {
  const list = await listChanges();
  return Promise.all(list.map(async (c) => ({ ...c, ...(await measure(c)) })));
}
