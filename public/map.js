/* Funnel Dashboard – MAPA funnela (glavni ekran).
   Koristi pomoćne funkcije iz dashboard.js (evaluate, priorities, fmt, eur, p1, pct, go, recBtn…). */
const MAP = { sel: null, analysis: false, bust: {} };

const shotUrl = (view) => {
  const raw = unesc(view);
  return "/api/shot?url=" + encodeURIComponent(raw) + (MAP.bust[raw] ? "&v=" + MAP.bust[raw] : "");
};
const host = (view) => { try { return new URL(unesc(view)).hostname.replace(/^www\./, ""); } catch (e) { return ""; } };

/* glavni koraci u nizu; bump-ovi vise ispod prethodnog koraka (checkout) */
function mapSteps(f) {
  const main = [];
  f.steps.forEach((s, i) => {
    const st = { ...s, idx: i, bumps: [] };
    if (s.type === "bump" && main.length) main[main.length - 1].bumps.push(st);
    else main.push(st);
  });
  return main;
}

/* tekst iznad strelice: koliko ljudi ide dalje sa ovog koraka */
function flowLabel(s) {
  if (!s.views) return "";
  const r = pct(s.conversions, s.views);
  const word = { landing: "ide dalje", optin: "se prijavi", checkout: "kupi", upsell: "prihvati", downsell: "prihvati" }[s.type] || "dalje";
  return `${p1(r)} ${word}`;
}

/* najveća šansa po funnelu (iz postojeće analize) */
function topChance(f) {
  const E = evaluate(f);
  return [...E.bad, ...E.warn].filter((it) => it.s && it.gain > 0).sort((a, b) => b.gain - a.gain)[0] || null;
}

function pageCard(f, s, chance) {
  const L = s.links || {};
  const g = grade(s);
  const hot = chance && chance.s.step_id === s.step_id;
  const selected = MAP.sel && MAP.sel.fid === f.id && MAP.sel.idx === s.idx;
  const thumb = L.view
    ? `<img src="${shotUrl(L.view)}" alt="" loading="lazy" onload="this.parentNode.classList.add('ok')" onerror="this.parentNode.classList.add('err')"><span class="m-load">Slikam stranicu…</span><span class="m-noimg">Slika nije dostupna</span>`
    : `<span class="m-noimg" style="display:flex">Nema stranice</span>`;
  return `<div class="m-page ${selected ? "sel" : ""} ${hot && MAP.analysis ? "hot" : ""}" data-f="${f.id}" data-i="${s.idx}">
      ${hot && MAP.analysis ? `<div class="m-hot"><span class="m-hot-arrow">▼</span>+${eur(chance.gain)}</div>` : ""}
      <div class="m-browser"><div class="m-bar"><i></i><i></i><i></i><span>${L.view ? host(L.view) : ""}</span></div><div class="m-thumb">${thumb}</div></div>
      <div class="m-cap"><span class="type ${s.type}">${TYPE_LABEL[s.type] || s.type}</span>${MAP.analysis && g ? `<span class="m-grade ${g}"></span>` : ""}</div>
      <div class="m-nums"><b>${fmt(s.views)}</b> posetilaca${s.revenue ? ` · <b>${eur(s.revenue)}</b>` : ""}</div>
    </div>`;
}

function bumpCard(f, b, chance) {
  const hot = MAP.analysis && chance && chance.s.step_id === b.step_id;
  const selected = MAP.sel && MAP.sel.fid === f.id && MAP.sel.idx === b.idx;
  return `<div class="m-bump ${selected ? "sel" : ""} ${hot ? "hot" : ""}" data-f="${f.id}" data-i="${b.idx}">
      <span class="type bump">Order bump</span> ${p1(pct(b.conversions, b.views))} uzme${b.revenue ? ` · <b>${eur(b.revenue)}</b>` : ""}
      ${hot ? `<div class="m-hot-inline">◀ +${eur(chance.gain)}</div>` : ""}
    </div>`;
}

function arrow(s, chance) {
  const r = s.views ? pct(s.conversions, s.views) : 0;
  const leak = MAP.analysis && chance && chance.s.step_id === s.step_id;
  const dots = Math.max(1, Math.min(4, Math.round(r / 10)));
  let d = "";
  for (let k = 0; k < dots; k++) d += `<i style="animation-delay:${(k * 1.8) / dots}s"></i>`;
  return `<div class="m-arrow ${leak ? "leak" : ""}"><span class="m-pc">${flowLabel(s)}</span><div class="m-line">${d}</div></div>`;
}

function funnelRow(f) {
  const chance = topChance(f);
  const main = mapSteps(f);
  let flow = "";
  main.forEach((s, i) => {
    flow += `<div class="m-col">${pageCard(f, s, chance)}${s.bumps.length ? `<div class="m-drop"></div>${s.bumps.map((b) => bumpCard(f, b, chance)).join("")}` : ""}</div>`;
    if (i < main.length - 1) flow += arrow(s, chance);
  });
  return `<section class="m-row" id="row-${f.id}">
      <div class="m-head">
        <div><button class="m-name" data-open="${f.id}" title="Otvori detaljnu analizu funnela">${f.name} <span>→</span></button>
          <span class="site-tag">${f.site.name} · ${fmt(f.orders)} porudžbina · konverzija ${p1(f.cr)}</span></div>
        <div class="m-rev">${eur(f.revenue)}<small>${periodLabel()}</small></div>
      </div>
      <div class="m-flow">${flow}</div>
    </section>`;
}

/* ---------- desni panel ---------- */
function sideOverview(F) {
  const rev = F.reduce((a, f) => a + f.revenue, 0);
  const orders = F.reduce((a, f) => a + f.orders, 0);
  const P = MAP.analysis ? priorities(F).filter((it) => it.s).slice(0, 5) : [];
  return `<div class="m-side-h">Ukupno</div>
    <div class="m-total">${eur(rev)}</div>
    <div class="site-tag" style="margin-bottom:14px">${F.length} funnela · ${fmt(orders)} porudžbina</div>
    ${MAP.analysis
      ? `<div class="m-side-h">Najveće šanse</div>${P.length ? P.map((it, k) => `<button class="m-chance" data-f="${it.f.id}" data-i="${it.f.steps.indexOf(it.s)}"><b>${k + 1}. ${it.f.name} · ${TYPE_LABEL[it.s.type]}</b><span>${p1(it.r)} (cilj ${it.b.good}%) · <em>+${eur(it.gain)}</em></span></button>`).join("") : `<div class="act-empty">Svi koraci su na cilju.</div>`}`
      : `<div class="m-hint">Klikni na stranicu da vidiš detalje.<br>Uključi <b>Analizu</b> da vidiš gde funneli gube najviše novca.</div>`}`;
}

function sideStep(f, s) {
  const L = s.links || {};
  const g = grade(s);
  const b = BENCH[s.type];
  const tips = (TIPS[s.type] || {})[g] || [];
  const r = pct(s.conversions, s.views);
  const chance = topChance(f);
  REC = [];
  return `<button class="m-close" id="mClose">← Pregled</button>
    <div class="m-side-h">${f.name}</div>
    <h3 class="m-step-t"><span class="type ${s.type}">${TYPE_LABEL[s.type] || s.type}</span> ${s.name}</h3>
    ${L.view ? `<a href="${L.view}" target="_blank" rel="noopener" class="m-big"><img src="${shotUrl(L.view)}" alt=""></a>` : ""}
    <div class="m-stats">
      <div><span>Posetioci</span><b>${fmt(s.views)}</b></div>
      <div><span>${s.type === "checkout" ? "Kupovine" : "Dalje"}</span><b>${fmt(s.conversions)}</b></div>
      <div><span>Konverzija</span><b class="${g || ""}">${s.views ? p1(r) : "–"}</b></div>
      <div><span>Prihod</span><b>${eur(s.revenue)}</b></div>
    </div>
    ${b ? `<div class="m-bench">Cilj za ${TYPE_LABEL[s.type].toLowerCase()}: <b>${b.good}%</b> (${b.label}) · ispod ${b.bad}% je loše</div>` : ""}
    ${chance && chance.s.step_id === s.step_id ? `<div class="m-chance-box"><b>Najveća šansa u ovom funnelu</b>Na ${b.good}% konverzije ovo je oko <b>+${eur(chance.gain)}</b> u istom periodu.</div>` : ""}
    ${tips.length ? `<div class="m-side-h" style="margin-top:14px">Šta uraditi</div><ul class="m-tips">${tips.map((t) => `<li>${t}</li>`).join("")}</ul>` : ""}
    <div class="m-acts">
      ${L.view ? `<a class="act ghost" href="${L.view}" target="_blank" rel="noopener">Otvori stranicu ↗</a>` : ""}
      ${L.edit ? `<a class="act ghost" href="${L.edit}" target="_blank" rel="noopener">Uredi u FunnelKitu ↗</a>` : ""}
      ${recBtn(f, s, null, "✎ Zabeleži izmenu")}
    </div>
    ${L.view ? `<div class="m-side-h" style="margin-top:16px">Slika stranice</div>
    <div class="m-acts">
      <button class="act ghost" id="mRefresh">↻ Osveži sliku</button>
      <label class="act ghost">⬆ Ubaci svoju sliku<input type="file" id="mUpload" accept="image/jpeg,image/png,image/webp" hidden></label>
      <button class="act ghost" id="mReset" title="Ukloni ručnu sliku i vrati automatsku">Vrati automatsku</button>
    </div><div class="m-msg" id="mMsg"></div>` : ""}`;
}

/* ---------- glavni render ---------- */
function renderMap(F) {
  const el = document.getElementById("mapView");
  const sorted = [...F].sort((a, b) => b.revenue - a.revenue);
  const selF = MAP.sel && F.find((f) => f.id === MAP.sel.fid);
  const selS = selF && selF.steps[MAP.sel.idx];
  if (MAP.sel && !selS) MAP.sel = null;
  el.innerHTML = `
    <div class="m-top">
      <div class="m-legend">${DATA.demo ? `<span class="m-demo">DEMO podaci</span>` : ""}Prave stranice · brojevi za ${periodLabel()}</div>
      <button class="chip ${MAP.analysis ? "active" : ""}" id="mAnalysis">${MAP.analysis ? "✓ Analiza uključena" : "⚡ Analiza"}</button>
    </div>
    <div class="m-layout">
      <div class="m-board">${sorted.map(funnelRow).join("")}</div>
      <aside class="m-side" id="mSide">${selS ? sideStep(selF, selS) : sideOverview(F)}</aside>
    </div>`;
  bindMap(el, F);
}

function bindMap(el, F) {
  el.querySelector("#mAnalysis").onclick = () => { MAP.analysis = !MAP.analysis; renderMap(F); };
  el.querySelectorAll("[data-open]").forEach((b) => (b.onclick = () => go(b.dataset.open)));
  el.querySelectorAll(".m-page,.m-bump,.m-chance").forEach((c) => (c.onclick = (e) => {
    e.stopPropagation();
    MAP.sel = { fid: c.dataset.f, idx: +c.dataset.i };
    renderMap(F);
    const row = document.getElementById("row-" + c.dataset.f);
    if (c.classList.contains("m-chance") && row) row.scrollIntoView({ behavior: "smooth", block: "center" });
  }));
  const close = el.querySelector("#mClose");
  if (close) close.onclick = () => { MAP.sel = null; renderMap(F); };
  bindRec(el);

  const selF = MAP.sel && F.find((f) => f.id === MAP.sel.fid);
  const view = selF && (selF.steps[MAP.sel.idx].links || {}).view;
  if (!view) return;
  const raw = unesc(view);
  const msg = (t, bad) => { const m = document.getElementById("mMsg"); if (m) { m.textContent = t; m.className = "m-msg" + (bad ? " bad" : ""); } };
  const reload = () => { MAP.bust[raw] = Date.now(); renderMap(F); };
  el.querySelector("#mRefresh").onclick = async () => {
    msg("Pravim novu sliku… (10–20 s)");
    const r = await fetch("/api/shot?refresh=1&url=" + encodeURIComponent(raw), { credentials: "same-origin" });
    if (r.ok && r.headers.get("X-Shot-Source") === "manual") return msg("Ova stranica ima tvoju sliku. Klikni „Vrati automatsku” da je skineš.", true);
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
