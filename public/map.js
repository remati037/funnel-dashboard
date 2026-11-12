/* Funnel Dashboard – MAPA funnela (glavni ekran).
   Koristi pomoćne funkcije iz dashboard.js (evaluate, priorities, fmt, eur, p1, pct, go, recBtn, IC…). */
/* bust: verzija slike po adresi – menja se samo na „Osveži”, pa pregledač inače čuva sliku i ne čeka server */
const BUST_KEY = "fdash-shot-v";
const loadBust = () => { try { return JSON.parse(localStorage.getItem(BUST_KEY) || "{}") || {}; } catch { return {}; } };
const saveBust = () => { try { localStorage.setItem(BUST_KEY, JSON.stringify(MAP.bust)); } catch { /* privatni prozor */ } };
const MAP = { sel: null, analysis: false, bust: loadBust(), shooting: null };

const shotUrl = (view) => {
  const raw = unesc(view);
  return "/api/shot?url=" + encodeURIComponent(raw) + (MAP.bust[raw] ? "&v=" + MAP.bust[raw] : "");
};

/* sve stranice sa mape (bez duplikata) */
const allViews = (F) => [...new Set(F.flatMap((f) => f.steps.map((s) => (s.links || {}).view).filter(Boolean).map(unesc)))];

/* „Osveži slike”: ponovo slika sve stranice (po 3 odjednom) i menja sličice čim koja stigne */
async function refreshAllShots(F) {
  if (MAP.shooting) return;
  const list = allViews(F);
  let done = 0, failed = 0;
  MAP.shooting = { done, total: list.length };
  const btn = () => document.getElementById("shotsBtn");
  const label = () => { const b = btn(); if (b) b.querySelector("span").textContent = MAP.shooting ? `Slikam ${MAP.shooting.done}/${MAP.shooting.total}…` : "Osveži slike"; };
  if (btn()) btn().classList.add("busy");
  label();
  const queue = [...list];
  const worker = async () => {
    for (let raw; (raw = queue.shift()); ) {
      try {
        const r = await fetch("/api/shot?refresh=1&url=" + encodeURIComponent(raw), { credentials: "same-origin" });
        if (!r.ok) throw 0;
        MAP.bust[raw] = Date.now();
        saveBust();
        const src = shotUrl(raw);
        document.querySelectorAll(`img[data-shot="${CSS.escape(raw)}"]`).forEach((img) => { img.src = src; });
      } catch { failed++; }
      MAP.shooting.done = ++done;
      label();
    }
  };
  await Promise.all([worker(), worker(), worker()]);
  MAP.shooting = null;
  if (btn()) btn().classList.remove("busy");
  label();
  const m = document.getElementById("shotsMsg");
  if (m) m.textContent = failed ? `${failed} ${plural(failed, "stranica nije uslikana", "stranice nisu uslikane", "stranica nije uslikano")}` : "Slike su osvežene";
}
const plural = (n, one, few, many) => n % 10 === 1 && n % 100 !== 11 ? one : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14) ? few : many;
const bumpName = (s) => String(s.name || "").replace(/^order bump:\s*/i, "") || "Order bump";

/* glavni koraci u nizu; bump-ovi pripadaju prethodnom koraku (checkout) */
function mapSteps(f) {
  const main = [];
  f.steps.forEach((s, i) => {
    const st = { ...s, idx: i, bumps: [] };
    if (s.type === "bump" && main.length) main[main.length - 1].bumps.push(st);
    else main.push(st);
  });
  return main;
}

function flowLabel(s) {
  if (!s.views) return "";
  const word = { landing: "ide dalje", optin: "se prijavi", checkout: "kupi", upsell: "prihvati", downsell: "prihvati" }[s.type] || "dalje";
  return `<b>${p1(pct(s.conversions, s.views))}</b><span>${word}</span>`;
}

/* najveća šansa po funnelu (postojeća analiza) */
function topChance(f) {
  const E = evaluate(f);
  return [...E.bad, ...E.warn].filter((it) => it.s && it.gain > 0).sort((a, b) => b.gain - a.gain)[0] || null;
}
const isHot = (chance, s) => MAP.analysis && chance && chance.s.step_id === s.step_id;
const isSel = (f, s) => MAP.sel && MAP.sel.fid === f.id && MAP.sel.idx === s.idx;

function pageCard(f, s, chance) {
  const L = s.links || {};
  const g = grade(s);
  const hot = isHot(chance, s);
  const thumb = L.view
    ? `<img src="${shotUrl(L.view)}" data-shot="${esc(unesc(L.view))}" alt="" loading="lazy" onload="this.parentNode.classList.add('ok')" onerror="this.parentNode.classList.add('err')"><span class="m-load">Slikam stranicu…</span><span class="m-noimg">${IC.image}Slika nije dostupna</span>`
    : `<span class="m-noimg" style="display:flex">${IC.image}Nema stranice</span>`;
  return `<div class="m-page ${isSel(f, s) ? "sel" : ""} ${hot ? "hot" : ""}" data-f="${f.id}" data-i="${s.idx}" role="button" tabindex="0" aria-label="${TYPE_LABEL[s.type] || s.type}: detalji">
      ${hot ? `<div class="m-tag">${IC.trendUp}+${eur(chance.gain)} potencijal</div>` : ""}
      <div class="m-shot">${thumb}</div>
      <div class="m-lbl"><span style="color:var(--text);font-size:13px;font-weight:500">${MAP.analysis && g ? `<i class="m-dot ${g}"></i>` : ""}${TYPE_LABEL[s.type] || s.type}</span><span>${fmt(s.views)} posetilaca</span></div>
      ${s.revenue ? `<div class="m-lbl2">Prihod <b>${eur(s.revenue)}</b></div>` : ""}
    </div>`;
}

function bumpsBlock(f, s, chance) {
  if (!s.bumps.length) return s.type === "checkout" && MAP.analysis ? `<div class="m-bumps"><div class="none">Nema order bumpa na ovom checkoutu</div></div>` : "";
  const n = s.bumps.length;
  const total = s.bumps.reduce((a, b) => a + b.revenue, 0);
  return `<div class="m-bumps"><div class="h">${IC.layers}${n} ${plural(n, "order bump", "order bumpa", "order bumpova")}${n > 1 ? ` · ${eur(total)}` : ""}</div>${s.bumps
    .map((b) => {
      const hot = isHot(chance, b);
      return `<button class="m-bump ${isSel(f, b) ? "sel" : ""} ${hot ? "hot" : ""}" data-f="${f.id}" data-i="${b.idx}">
          <span class="n">${bumpName(b)}</span>
          <span class="d"><span>${p1(pct(b.conversions, b.views))} uzme · ${fmt(b.conversions)}</span>${hot ? `<em>+${eur(chance.gain)}</em>` : `<b>${eur(b.revenue)}</b>`}</span>
        </button>`;
    })
    .join("")}</div>`;
}

function arrow(s, chance) {
  const r = s.views ? pct(s.conversions, s.views) : 0;
  const dots = Math.max(1, Math.min(4, Math.round(r / 10)));
  let d = "";
  for (let k = 0; k < dots; k++) d += `<i style="animation-delay:${(k * 2.2) / dots}s"></i>`;
  return `<div class="m-arrow ${isHot(chance, s) ? "leak" : ""}"><div class="m-pc">${flowLabel(s)}</div><div class="m-line">${d}</div></div>`;
}

function funnelRow(f) {
  const chance = topChance(f);
  const main = mapSteps(f);
  let flow = "";
  main.forEach((s, i) => {
    flow += `<div class="m-col">${pageCard(f, s, chance)}${bumpsBlock(f, s, chance)}</div>`;
    if (i < main.length - 1) flow += arrow(s, chance);
  });
  return `<section class="m-row" id="row-${f.id}">
      <div class="m-head">
        <div><button class="m-name" data-open="${f.id}" title="Otvori detaljnu analizu funnela">${f.name}${IC.arrowR}</button>
          <div class="m-meta">${f.site.name} · ${fmt(f.orders)} ${plural(f.orders, "porudžbina", "porudžbine", "porudžbina")} · konverzija ${p1(f.cr)}${f.drafts_hidden ? ` · <span class="m-drafts" title="Koraci u draftu (ugašeni u FunnelKitu) nisu prikazani">${f.drafts_hidden} ${plural(f.drafts_hidden, "korak", "koraka", "koraka")} u draftu skriveno</span>` : ""}</div></div>
        <div class="m-rev">${eur(f.revenue)}<small>prihod u periodu</small></div>
      </div>
      <div class="m-flow">${flow}</div>
    </section>`;
}

/* ---------- desni panel ---------- */
function sideOverview(F) {
  const P = priorities(F).filter((it) => it.s).slice(0, 6);
  return `<h3>Najveće šanse</h3>
    <div class="s">Gde funneli gube najviše novca, poređano po iznosu.</div>
    ${P.length
      ? P.map((it, k) => `<button class="m-op" data-f="${it.f.id}" data-i="${it.f.steps.indexOf(it.s)}"><span class="n">${k + 1}</span><span><span class="t">${it.f.name} · ${TYPE_LABEL[it.s.type]}</span><small>${p1(it.r)} · cilj ${it.b.good}%</small></span><span class="g">+${eur(it.gain)}</span></button>`).join("")
      : `<div class="act-empty">Svi koraci su na cilju.</div>`}
    <div class="m-hint" style="margin-top:14px">Klikni na stranicu za detalje. <b>Analiza</b> gore desno označi najveću šansu u svakom funnelu.</div>`;
}

function sideStep(f, s) {
  const L = s.links || {};
  const g = grade(s);
  const b = BENCH[s.type];
  const tips = (TIPS[s.type] || {})[g] || [];
  const r = pct(s.conversions, s.views);
  const chance = topChance(f);
  REC = [];
  return `<button class="m-close" id="mClose">${IC.arrowL}Sve šanse</button>
    <div class="m-crumb">${f.name}</div>
    <h3 class="m-step-t"><span class="type ${s.type}">${TYPE_LABEL[s.type] || s.type}</span>${s.type === "bump" ? bumpName(s) : s.name}</h3>
    ${L.view ? `<a href="${L.view}" target="_blank" rel="noopener" class="m-big" title="Otvori stranicu"><img src="${shotUrl(L.view)}" data-shot="${esc(unesc(L.view))}" alt=""></a>` : ""}
    <div class="m-stats">
      <div><span>Posetioci</span><b>${fmt(s.views)}</b></div>
      <div><span>${s.type === "checkout" ? "Kupovine" : s.type === "bump" || isOffer(s.type) ? "Prihvatilo" : "Ide dalje"}</span><b>${fmt(s.conversions)}</b></div>
      <div><span>Konverzija</span><b class="${g || ""}">${s.views ? p1(r) : "–"}</b></div>
      <div><span>Prihod</span><b>${eur(s.revenue)}</b></div>
    </div>
    ${b ? `<div class="m-bench">Cilj: <b>${b.good}%</b> ${b.label} · ispod ${b.bad}% je loše</div>` : ""}
    ${chance && chance.s.step_id === s.step_id ? `<div class="m-chance-box"><strong>Najveća šansa u ovom funnelu</strong>Na ${b.good}% konverzije ovaj korak donosi oko <b>+${eur(chance.gain)}</b> više u istom periodu.</div>` : ""}
    ${tips.length ? `<div class="m-sh">Šta uraditi</div><ul class="m-tips">${tips.map((t) => `<li>${t}</li>`).join("")}</ul>` : ""}
    <div class="m-acts">
      ${recBtn(f, s, null, "Zabeleži izmenu")}
      ${L.view ? `<a class="act ghost" href="${L.view}" target="_blank" rel="noopener">Otvori stranicu ${IC.ext}</a>` : ""}
      ${L.edit ? `<a class="act ghost" href="${L.edit}" target="_blank" rel="noopener">FunnelKit ${IC.ext}</a>` : ""}
    </div>
    ${L.view ? `<div class="m-sh">Slika stranice</div>
    <div class="m-acts" style="margin-top:0">
      <button class="act ghost" id="mRefresh">${IC.refresh}Osveži</button>
      <label class="act ghost">${IC.upload}Ubaci svoju<input type="file" id="mUpload" accept="image/jpeg,image/png,image/webp" hidden></label>
      <button class="act ghost" id="mReset" title="Ukloni ručnu sliku i vrati automatsku">${IC.undo}Automatska</button>
    </div><div class="m-msg" id="mMsg"></div>` : ""}`;
}

/* ---------- glavni render ---------- */
function renderMap(F) {
  const el = document.getElementById("mapView");
  const sorted = [...F].sort((a, b) => b.revenue - a.revenue);
  const selF = MAP.sel && F.find((f) => f.id === MAP.sel.fid);
  const selS = selF && selF.steps[MAP.sel.idx];
  if (MAP.sel && !selS) MAP.sel = null;
  const rev = F.reduce((a, f) => a + f.revenue, 0);
  const orders = F.reduce((a, f) => a + f.orders, 0);
  const keepScroll = el.querySelector(".m-side") ? el.querySelector(".m-side").scrollTop : 0;
  el.innerHTML = `
    <div class="m-sum"><span class="l">Ukupan prihod</span><span class="v">${eur(rev)}</span>
      <span class="s">${F.length} ${plural(F.length, "funnel", "funnela", "funnela")} · ${fmt(orders)} ${plural(orders, "porudžbina", "porudžbine", "porudžbina")} · ${periodLabel()}</span>
      ${DATA.demo ? `<span class="m-demo">Demo podaci</span>` : ""}
      <span class="m-shots"><span class="m-shots-msg" id="shotsMsg"></span><button class="act ghost ${MAP.shooting ? "busy" : ""}" id="shotsBtn" title="Ponovo uslikaj sve stranice sa sajtova (posle izmena na stranicama)">${IC.refresh}<span>${MAP.shooting ? `Slikam ${MAP.shooting.done}/${MAP.shooting.total}…` : "Osveži slike"}</span></button></span></div>
    <div class="m-layout">
      <div class="m-board">${sorted.map(funnelRow).join("")}</div>
      <aside class="m-side" id="mSide">${selS ? sideStep(selF, selS) : sideOverview(F)}</aside>
    </div>`;
  if (!selS) el.querySelector(".m-side").scrollTop = keepScroll;
  bindMap(el, F);
}

function bindMap(el, F) {
  const sb = el.querySelector("#shotsBtn");
  if (sb) sb.onclick = () => refreshAllShots(F);
  el.querySelectorAll("[data-open]").forEach((b) => (b.onclick = () => go(b.dataset.open)));
  el.querySelectorAll(".m-page,.m-bump,.m-op").forEach((c) => {
    const open = (e) => {
      e.stopPropagation();
      MAP.sel = { fid: c.dataset.f, idx: +c.dataset.i };
      renderMap(F);
      const row = document.getElementById("row-" + c.dataset.f);
      if (c.classList.contains("m-op") && row) row.scrollIntoView({ behavior: "smooth", block: "center" });
    };
    c.onclick = open;
    c.onkeydown = (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(e); } };
  });
  const close = el.querySelector("#mClose");
  if (close) close.onclick = () => { MAP.sel = null; renderMap(F); };
  bindRec(el);

  const selF = MAP.sel && F.find((f) => f.id === MAP.sel.fid);
  const view = selF && (selF.steps[MAP.sel.idx].links || {}).view;
  if (!view) return;
  const raw = unesc(view);
  const msg = (t, bad) => { const m = document.getElementById("mMsg"); if (m) { m.textContent = t; m.className = "m-msg" + (bad ? " bad" : ""); } };
  const reload = () => { MAP.bust[raw] = Date.now(); saveBust(); renderMap(F); };
  el.querySelector("#mRefresh").onclick = async () => {
    msg("Pravim novu sliku… (10–20 s)");
    const r = await fetch("/api/shot?refresh=1&url=" + encodeURIComponent(raw), { credentials: "same-origin" });
    if (r.ok && r.headers.get("X-Shot-Source") === "manual") return msg("Ova stranica ima tvoju sliku. Klikni „Automatska” da je skineš.", true);
    r.ok ? reload() : msg("Slika nije napravljena. Probaj ponovo ili ubaci svoju.", true);
  };
  el.querySelector("#mUpload").onchange = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    const fd = new FormData(); fd.append("url", raw); fd.append("file", file);
    msg("Šaljem sliku…");
    const r = await fetch("/api/shot", { method: "POST", body: fd, credentials: "same-origin" });
    const j = await r.json().catch(() => ({}));
    r.ok ? reload() : msg(j.message || "Slanje nije uspelo.", true);
  };
  el.querySelector("#mReset").onclick = async () => {
    const r = await fetch("/api/shot?url=" + encodeURIComponent(raw), { method: "DELETE", credentials: "same-origin" });
    r.ok ? reload() : msg("Nije uspelo.", true);
  };
}

/* map.js može da stigne posle prvog prikaza – tada ponovo iscrtaj */
if (typeof render === "function" && typeof DATA !== "undefined" && DATA) render();
