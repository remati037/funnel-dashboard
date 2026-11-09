
/* Funnel Dashboard – UI (podaci stižu sa REST rute fdash/v1/aggregate) */
let DATA = null;
/* ikonice (Lucide, MIT) */
const _i = d => `<svg class="i" viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
const IC = {
  funnel:_i('<path d="M3 4h18l-7 8.5V19l-4 2v-8.5z"/>'),
  refresh:_i('<path d="M21 12a9 9 0 1 1-2.6-6.4L21 8"/><path d="M21 3v5h-5"/>'),
  activity:_i('<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>'),
  globe:_i('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>'),
  calendar:_i('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>'),
  settings:_i('<path d="M12.2 2h-.4a2 2 0 0 0-2 2v.2a2 2 0 0 1-1 1.7l-.4.3a2 2 0 0 1-2 0l-.2-.1a2 2 0 0 0-2.7.7l-.2.4a2 2 0 0 0 .7 2.7l.2.1a2 2 0 0 1 1 1.7v.5a2 2 0 0 1-1 1.7l-.2.1a2 2 0 0 0-.7 2.7l.2.4a2 2 0 0 0 2.7.7l.2-.1a2 2 0 0 1 2 0l.4.3a2 2 0 0 1 1 1.7v.2a2 2 0 0 0 2 2h.4a2 2 0 0 0 2-2v-.2a2 2 0 0 1 1-1.7l.4-.3a2 2 0 0 1 2 0l.2.1a2 2 0 0 0 2.7-.7l.2-.4a2 2 0 0 0-.7-2.7l-.2-.1a2 2 0 0 1-1-1.7v-.5a2 2 0 0 1 1-1.7l.2-.1a2 2 0 0 0 .7-2.7l-.2-.4a2 2 0 0 0-2.7-.7l-.2.1a2 2 0 0 1-2 0l-.4-.3a2 2 0 0 1-1-1.7V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>'),
  logout:_i('<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>'),
  arrowR:_i('<path d="M5 12h14M13 5l7 7-7 7"/>'),
  arrowL:_i('<path d="M19 12H5M11 5l-7 7 7 7"/>'),
  ext:_i('<path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>'),
  pen:_i('<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>'),
  upload:_i('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>'),
  undo:_i('<path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-15-6.7L3 13"/>'),
  trendUp:_i('<path d="m22 7-8.5 8.5-5-5L2 17"/><path d="M16 7h6v6"/>'),
  plus:_i('<path d="M12 5v14M5 12h14"/>'),
  minus:_i('<path d="M5 12h14"/>'),
  image:_i('<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21"/>'),
  sun:'<svg class="i sun" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
  moon:'<svg class="i moon" viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>',
  layers:_i('<path d="m12 2 10 5-10 5L2 7z"/><path d="m2 17 10 5 10-5M2 12l10 5 10-5"/>'),
};
const initials = e => { const n=String(e||"").split("@")[0].split(/[._-]+/).filter(Boolean); return ((n[0]||"?")[0]+((n[1]||"")[0]||"")).toUpperCase(); };
/* ---------- periodi ---------- */
const PRESETS = [
  {k:"today",l:"Danas"},{k:"yesterday",l:"Juče"},{k:"7",l:"7 dana"},{k:"30",l:"30 dana"},
  {k:"month",l:"Ovaj mesec"},{k:"lastmonth",l:"Prošli mesec"},{k:"90",l:"90 dana"},{k:"custom",l:"Proizvoljno"},
];
const ymd = d => d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
const dmy = s => s ? s.split("-").reverse().join(".") : "";
function presetRange(k){
  const t=new Date(); t.setHours(12,0,0,0);
  const add=(d,n)=>{const x=new Date(d); x.setDate(x.getDate()+n); return x;};
  switch(k){
    case "today": return [ymd(t),ymd(t)];
    case "yesterday": { const y=add(t,-1); return [ymd(y),ymd(y)]; }
    case "month": return [ymd(new Date(t.getFullYear(),t.getMonth(),1)),ymd(t)];
    case "lastmonth": return [ymd(new Date(t.getFullYear(),t.getMonth()-1,1)),ymd(new Date(t.getFullYear(),t.getMonth(),0))];
    default: { const n=parseInt(k,10)||30; return [ymd(add(t,-(n-1))),ymd(t)]; }
  }
}
function periodLabel(){
  const p=PRESETS.find(x=>x.k===state.period.k);
  return (p&&p.k!=="custom"?p.l+" · ":"")+dmy(state.period.from)+(state.period.from!==state.period.to?" – "+dmy(state.period.to):"");
}
const CUR = () => (!DATA || DATA.currency==="EUR") ? "€" : (DATA.currency||"");
const APP = document.getElementById("fdash-app");
/* ---------- tema (svetla / tamna) ---------- */
function themeNow(){ return document.documentElement.getAttribute("data-theme")==="dark"?"dark":"light"; }
function setTheme(t){
  document.documentElement.setAttribute("data-theme",t);
  try{ localStorage.setItem("fdash_theme",t); }catch(e){}
  const b=document.getElementById("themeBtn"); if(b) b.title=t==="dark"?"Svetla tema":"Tamna tema";
}
(function(){ let t=null; try{ t=localStorage.getItem("fdash_theme"); }catch(e){}
  if(t!=="dark"&&t!=="light") t=(window.matchMedia&&matchMedia("(prefers-color-scheme: dark)").matches)?"dark":"light";
  document.documentElement.setAttribute("data-theme",t); })();

function shell(){
  APP.innerHTML = `
  <div class="fd-header">
    <div class="brand"><div class="logo">${IC.funnel}</div><h1>${esc(FDASH.title||"Funnel Dashboard")} <small id="updated"></small></h1></div>
    <div class="seg" id="modeChips"></div>
    <div class="controls">
      <div id="siteChips" class="controls"></div>
      <div id="rangeChips" class="controls"></div>
      <button class="ibtn theme-btn" id="themeBtn" title="${themeNow()==="dark"?"Svetla tema":"Tamna tema"}" aria-label="Promeni temu">${IC.moon}${IC.sun}</button>
      <button class="ibtn" id="refreshBtn" title="Ponovo povuci podatke sa svih sajtova" aria-label="Osveži podatke">${IC.refresh}</button>
      <button class="btn-pri" id="anBtn" style="display:none">${IC.activity}<span>Analiza</span></button>
      <div class="user" id="userMenu"><button class="avatar" id="avatarBtn" aria-label="Nalog">${esc(initials(FDASH.userName))}</button>
        <div class="menu"><div class="who">${esc(FDASH.userName||"")}</div>
          ${FDASH.settingsUrl?`<a href="${FDASH.settingsUrl}">${IC.settings}Sajtovi</a>`:""}
          ${FDASH.logoutUrl?`<a href="${FDASH.logoutUrl}">${IC.logout}Odjava</a>`:""}
        </div></div>
    </div>
  </div>
  <div class="fd-main">
    <div id="fdErrors"></div>
    <div id="mapView"></div>
    <div id="overview">
      <section class="kpis" id="kpis"></section>
      <section class="card" id="prio" style="margin-bottom:16px"></section>
      <section class="card" id="changes" style="margin-bottom:16px"></section>
      <section class="grid2">
        <div class="card"><h2>Svi funneli – rang lista</h2><table id="leader"></table></div>
        <div class="card"><h2>Uvidi</h2><div class="tabs" id="insTabs"></div><div class="ins" id="insights"></div></div>
      </section>
      <h2 style="font-size:15px;margin:8px 0 12px;font-weight:600">Svi funneli <span class="badge">klikni na funnel da ga otvoriš</span></h2>
      <section id="funnels" class="fgrid"></section>
    </div>
    <div id="detail"></div>
  </div>`;
  document.getElementById("refreshBtn").onclick=()=>load(true);
  document.getElementById("themeBtn").onclick=()=>setTheme(themeNow()==="dark"?"light":"dark");
  const um=document.getElementById("userMenu");
  document.getElementById("avatarBtn").onclick=e=>{e.stopPropagation();um.classList.toggle("open");};
  document.addEventListener("click",()=>um.classList.remove("open"));
}

let loading=false;
async function load(refresh){
  loading=true;
  const rb=document.getElementById("refreshBtn"); if(rb) rb.classList.add("spin");
  try{ localStorage.setItem("fdash_period", JSON.stringify(state.period)); }catch(e){}
  const u=document.getElementById("updated"); if(u) u.textContent="· učitavam…";
  try{
    const url=FDASH.api+(FDASH.api.includes("?")?"&":"?")+"from="+state.period.from+"&to="+state.period.to+(refresh?"&refresh=1":"");
    const r=await fetch(url,{headers:{"X-WP-Nonce":FDASH.nonce},credentials:"same-origin"});
    const j=await r.json();
    if(!r.ok) throw new Error(j && j.message ? j.message : "HTTP "+r.status);
    // nazivi dolaze sa drugih sajtova – escapujemo ih jednom, pre bilo kakvog prikaza
    (j.sites||[]).forEach(si=>{ si.name=esc(si.name); si.url=esc(si.url);
      (si.funnels||[]).forEach(f=>{ f.name=esc(f.name); f.edit_url=safeUrl(f.edit_url); (f.steps||[]).forEach(st=>{ st.name=esc(st.name); const L=st.links||{}; st.links={edit:safeUrl(L.edit),builder:safeUrl(L.builder),view:safeUrl(L.view)}; st.type=String(st.type).replace(/[^a-z]/g,""); }); }); });
    DATA=j;
  }catch(e){
    DATA={currency:"EUR",sites:[],errors:[{site:"Dashboard",message:e.message}]};
  }
  loading=false; render();
}

/* ---------------- state ---------------- */
let state = { site:"all", period:null, insTab:"bad", sort:"revenue", zoom:1, view:null, mode:"map" };
try{ if(localStorage.getItem("fdash_mode")==="list") state.mode="list"; }catch(e){}
function go(id){ state.view=id||null; try{ history.pushState(null,"",id?"#/funnel/"+id:location.pathname) }catch(e){} render(); window.scrollTo(0,0); }

const fmt = n => new Intl.NumberFormat("sr-RS",{maximumFractionDigits:0}).format(n);
const eur = n => fmt(n)+" "+CUR();
const pct = (a,b) => b ? (a/b*100) : 0;
const p1 = n => n.toFixed(1).replace(".",",")+"%";
const TYPE_LABEL = {landing:"Landing",optin:"Opt-in",checkout:"Checkout",bump:"Order bump",upsell:"Upsell",downsell:"Downsell",thankyou:"Hvala"};

/* Benchmarks za ocenjivanje koraka (možemo da ih podesimo po vašim ciljevima) */
const BENCH = {
  landing:{good:15, bad:8, label:"klik na kupovinu"},
  optin:{good:30, bad:15, label:"prijava"},
  checkout:{good:35, bad:20, label:"završena kupovina"},
  bump:{good:25, bad:10, label:"prihvaćen bump"},
  upsell:{good:12, bad:5, label:"prihvaćen upsell"},
  downsell:{good:12, bad:5, label:"prihvaćen downsell"},
};

function scaled(){
  const out=[];
  DATA.sites.forEach(s=>{
    if(state.site!=="all" && s.id!==state.site) return;
    s.funnels.forEach(f=>{
      const steps=f.steps.map(st=>({...st,views:+st.views||0,conversions:+st.conversions||0,revenue:+st.revenue||0}));
      if(!steps.length) return;
      const entry=steps[0].views;
      const revenue=steps.reduce((a,b)=>a+b.revenue,0);
      const co=steps.find(x=>x.type==="checkout");
      const orders=co?co.conversions:0;
      const extra=steps.filter(x=>["bump","upsell","downsell"].includes(x.type)).reduce((a,b)=>a+b.revenue,0);
      out.push({...f,site:s,steps,entry,revenue,orders,extra,
        aov:orders?revenue/orders:0, rpv:entry?revenue/entry:0, cr:pct(orders,entry)});
    });
  });
  return out;
}

function grade(st){
  const b=BENCH[st.type]; if(!b||!st.views) return null;
  const r=pct(st.conversions,st.views);
  return r>=b.good?"good":r<b.bad?"bad":"warn";
}

/* ---------------- render ---------------- */
function renderControls(){
  const mc=document.getElementById("modeChips");
  mc.innerHTML=[["map","Mapa"],["list","Detaljno"]].map(([k,l])=>`<button class="${state.mode===k&&!state.view?"active":""}" data-mode="${k}">${l}</button>`).join("");
  mc.querySelectorAll("button").forEach(b=>b.onclick=()=>{ state.mode=b.dataset.mode; try{localStorage.setItem("fdash_mode",state.mode)}catch(e){} go(null); });
  const sc=document.getElementById("siteChips");
  const sites=[{id:"all",name:"Svi sajtovi"},...(DATA?DATA.sites:[])];
  sc.innerHTML=`<label class="pick">${IC.globe}<select id="siteSel" aria-label="Sajt">${sites.map(s=>`<option value="${s.id}" ${state.site===s.id?"selected":""}>${s.name}</option>`).join("")}</select></label>`;
  document.getElementById("siteSel").onchange=e=>{state.site=e.target.value;go(null)};
  const rc=document.getElementById("rangeChips");
  const P=state.period;
  rc.innerHTML=`<label class="pick">${IC.calendar}<select id="periodSel" aria-label="Period">${PRESETS.map(r=>`<option value="${r.k}" ${P.k===r.k?"selected":""}>${r.k==="30"?"Poslednjih 30 dana":r.k==="7"?"Poslednjih 7 dana":r.k==="90"?"Poslednjih 90 dana":r.l}</option>`).join("")}</select></label>`+
    (P.k==="custom"?`<span class="fd-custom"><input type="date" id="pFrom" value="${P.from}" max="${ymd(new Date())}"> – <input type="date" id="pTo" value="${P.to}" max="${ymd(new Date())}"><button class="act" id="pApply">Primeni</button></span>`:"");
  document.getElementById("periodSel").onchange=e=>{
    const k=e.target.value;
    if(k==="custom"){ state.period={k, from:P.from, to:P.to}; renderControls(); return; }
    const [from,to]=presetRange(k); state.period={k,from,to}; load();
  };
  const ap=document.getElementById("pApply");
  if(ap) ap.onclick=()=>{ let f=document.getElementById("pFrom").value, t=document.getElementById("pTo").value; if(!f||!t) return; if(f>t){const x=f;f=t;t=x;} state.period={k:"custom",from:f,to:t}; load(); };
  const an=document.getElementById("anBtn");
  const showAn=state.mode==="map" && !state.view && typeof MAP!=="undefined";
  an.style.display=showAn?"":"none";
  if(showAn){ an.classList.toggle("on",MAP.analysis); an.querySelector("span").textContent=MAP.analysis?"Analiza uključena":"Analiza"; an.onclick=()=>{MAP.analysis=!MAP.analysis;render();}; }
  document.getElementById("refreshBtn").classList.toggle("spin",!!loading);
}

function renderKPIs(F){
  const rev=F.reduce((a,f)=>a+f.revenue,0), orders=F.reduce((a,f)=>a+f.orders,0),
        entry=F.reduce((a,f)=>a+f.entry,0), extra=F.reduce((a,f)=>a+f.extra,0);
  const k=[
    ["Ukupan prihod",eur(rev),`${F.length} funnela`],
    ["Porudžbine",fmt(orders),`konverzija ${p1(pct(orders,entry))}`],
    ["Prosečna korpa (AOV)",eur(orders?rev/orders:0),"prihod / porudžbina"],
    ["Prihod po posetiocu",money2(entry?rev/entry:0),"koliko vredi 1 poseta"],
    ["Bump + upsell prihod",eur(extra),`${p1(pct(extra,rev))} ukupnog prihoda`],
    ["Posetioci (ulaz)",fmt(entry),"prvi korak funnela"],
  ];
  document.getElementById("kpis").innerHTML=k.map(([l,v,s])=>`<div class="kpi"><div class="l">${l}</div><div class="v">${v}</div><div class="s">${s}</div></div>`).join("");
}

function renderLeader(F){
  const cols=[["name","Funnel"],["revenue","Prihod"],["orders","Porudž."],["cr","Konv."],["aov","AOV"],["rpv",CUR()+"/poseta"],["extra","Bump+Upsell"]];
  const sorted=[...F].sort((a,b)=>state.sort==="name"?a.name.localeCompare(b.name):b[state.sort]-a[state.sort]);
  const max=Math.max(...F.map(f=>f.revenue),1);
  const t=document.getElementById("leader");
  t.innerHTML=`<tr>${cols.map(([k,l],i)=>`<th class="${i?"num":""}" data-k="${k}">${l}${state.sort===k?" ↓":""}</th>`).join("")}</tr>`+
    sorted.map(f=>`<tr class="row" data-id="${f.id}">
      <td>${f.name}<span class="site-tag">${f.site.name} · ${f.site.url}</span><div class="bar"><i style="width:${f.revenue/max*100}%"></i></div></td>
      <td class="num"><b>${eur(f.revenue)}</b></td><td class="num">${fmt(f.orders)}</td>
      <td class="num">${p1(f.cr)}</td><td class="num">${eur(f.aov)}</td>
      <td class="num">${f.rpv.toFixed(2).replace(".",",")}</td><td class="num">${p1(pct(f.extra,f.revenue))}</td></tr>`).join("");
  t.querySelectorAll("th").forEach(th=>th.onclick=()=>{state.sort=th.dataset.k;render()});
  t.querySelectorAll("tr.row").forEach(tr=>tr.onclick=()=>{go(tr.dataset.id)});
}

function buildInsights(F){
  const bad=[],good=[],imp=[];
  const totalRev=F.reduce((a,f)=>a+f.revenue,0);
  const avgRpv=F.reduce((a,f)=>a+f.entry,0)?totalRev/F.reduce((a,f)=>a+f.entry,0):0;
  F.forEach(f=>{
    const tag=`${f.name} · ${f.site.name}`;
    const co=f.steps.find(s=>s.type==="checkout");
    if(co){
      const r=pct(co.conversions,co.views);
      if(r<BENCH.checkout.bad){
        const lost=Math.round((co.views*BENCH.checkout.good/100-co.conversions)*(co.conversions?co.revenue/co.conversions:0));
        bad.push({t:`Checkout curi: samo ${p1(r)} završi kupovinu`,m:tag,d:`${fmt(co.views-co.conversions)} ljudi napusti checkout. Na ${BENCH.checkout.good}% konverzije to je ~${eur(lost)} više. Proveri: broj polja, način plaćanja, cenu, poverenje (garancija, recenzije).`,v:lost});
      }
    }
    f.steps.forEach((s,i)=>{
      if(i===0||!s.views) return;
      const prev=f.steps[i-1];
      if(["landing","optin"].includes(prev.type)){
        const r=pct(prev.conversions,prev.views), b=BENCH[prev.type];
        if(r<b.bad) bad.push({t:`${TYPE_LABEL[prev.type]} slabo konvertuje (${p1(r)})`,m:tag,d:`Od ${fmt(prev.views)} posetilaca samo ${fmt(prev.conversions)} ide dalje. Testiraj naslov, ponudu iznad prvog skrola i CTA.`,v:prev.views});
      }
    });
    if(["landing","optin"].includes(f.steps[0].type) && pct(f.steps[0].conversions,f.steps[0].views)<BENCH[f.steps[0].type].bad && f.steps.length<=3){}
    f.steps.filter(s=>["bump","upsell","downsell"].includes(s.type)).forEach(s=>{
      const r=pct(s.conversions,s.views), b=BENCH[s.type];
      if(r<b.bad) imp.push({t:`${TYPE_LABEL[s.type]} "${s.name.split(": ")[1]||s.name}" – samo ${p1(r)} prihvata`,m:tag,d:`Ponuda ne odgovara kupcu ili je preskupa. Probaj nižu cenu, drugi proizvod ili jači copy.`,v:s.views});
      if(r>=b.good) good.push({t:`${TYPE_LABEL[s.type]} radi odlično (${p1(r)})`,m:tag,d:`"${s.name}" donosi ${eur(s.revenue)}. Kopiraj ovaj tip ponude u druge funnele.`,v:s.revenue});
    });
    if(!f.steps.some(s=>s.type==="bump") && f.orders>20) imp.push({t:"Nema order bump",m:tag,d:`${fmt(f.orders)} porudžbina bez bump ponude. Uz 20% prihvatanja i bump od ~20 ${CUR()} to je ~${eur(f.orders*.2*20)} više.`,v:f.orders*4});
    if(!f.steps.some(s=>s.type==="upsell") && f.orders>20) imp.push({t:"Nema upsell posle kupovine",m:tag,d:`Kupci su "topli" odmah posle plaćanja. Dodaj one-click upsell.`,v:f.orders*3});
    if(f.rpv>avgRpv*1.3 && f.revenue>0) good.push({t:`Najbolji prihod po posetiocu: ${money2(f.rpv)}`,m:tag,d:`Prosek svih funnela je ${money2(avgRpv)}. Ovde ima smisla pojačati reklame.`,v:f.rpv*10000});
    if(f.revenue<totalRev*0.01 && f.entry>100) bad.push({t:`Funnel skoro ništa ne zarađuje (${eur(f.revenue)})`,m:tag,d:`${fmt(f.entry)} ljudi uđe, a prihod je minimalan. Popravi ili ugasi i prebaci saobraćaj.`,v:f.entry});
  });
  const top=[...F].sort((a,b)=>b.revenue-a.revenue)[0];
  if(top) good.unshift({t:`Najjači funnel: ${top.name}`,m:top.site.name,d:`${eur(top.revenue)} – ${p1(pct(top.revenue,totalRev))} ukupnog prihoda.`,v:1e12});
  const by=a=>a.sort((x,y)=>y.v-x.v);
  return {bad:by(bad),good:by(good),imp:by(imp)};
}

function renderInsights(F){
  const I=buildInsights(F);
  const tabs=[["bad","Gde curi",I.bad.length],["good","Šta donosi",I.good.length],["imp","Šta unaprediti",I.imp.length]];
  const tt=document.getElementById("insTabs");
  tt.innerHTML=tabs.map(([k,l,n])=>`<button class="chip ${state.insTab===k?"active":""}" data-k="${k}">${l} (${n})</button>`).join("");
  tt.querySelectorAll("button").forEach(b=>b.onclick=()=>{state.insTab=b.dataset.k;render()});
  const cls={bad:"bad",good:"good",imp:"warn"}[state.insTab];
  const list=I[state.insTab];
  document.getElementById("insights").innerHTML=list.length?list.map(i=>`<div class="ins-item ${cls}"><b>${i.t}</b><span class="meta">${i.m}</span><div>${i.d}</div></div>`).join(""):`<div class="ins-item">Nema stavki.</div>`;
}

const isOffer = t => ["bump","upsell","downsell"].includes(t);
const money2 = n => n.toFixed(2).replace(".",",")+" "+CUR();

/* ---------- pregled: kartice funnela ---------- */
function renderFunnels(F){
  const el=document.getElementById("funnels");
  el.innerHTML=[...F].sort((a,b)=>b.revenue-a.revenue).map(f=>{
    const leaks=f.steps.filter(s=>grade(s)==="bad").length;
    return `<div class="fcard" data-id="${f.id}">
      <div class="top"><div><div class="f-title">${leaks?'<span class="alert-dot" title="ima korake koji cure"></span>':""}${f.name}</div>
        <span class="site-tag">${f.site.name} · ${f.site.url} · ${f.steps.length} koraka</span></div>
        <span class="open-link">Otvori</span></div>
      <div class="rev">${eur(f.revenue)}</div>
      <div class="mini"><span>${fmt(f.orders)} porudžbina</span><span>konv. ${p1(f.cr)}</span><span>AOV ${eur(f.aov)}</span><span>${money2(f.rpv)}/poseta</span></div>
      <div class="strip">${f.steps.map(s=>`<i class="${s.type}" title="${TYPE_LABEL[s.type]}: ${s.name}"></i>`).join("")}</div>
    </div>`;
  }).join("");
  el.querySelectorAll(".fcard").forEach(c=>c.onclick=()=>go(c.dataset.id));
}

/* ---------- detalj: canvas + plan akcije ---------- */
const TIPS = {
  landing:{
    bad:["Naslov mora odmah da kaže koji rezultat kupac dobija","CTA dugme iznad prvog skrola i ponovljeno posle svake sekcije","Dodaj dokaz: testimonijali, brojke, rezultati polaznika","Proveri da reklama obećava isto što i stranica","Proveri brzinu i izgled na mobilnom"],
    warn:["A/B testiraj naslov ili video iznad prvog skrola","CTA tekst sa koristi umesto „Kupi”","Dodaj FAQ sa najčešćim prigovorima"],
    good:["Stranica dobro konvertuje: pojačaj saobraćaj ka ovom funnelu","Iskoristi isti naslov i strukturu na drugim landing stranicama"]},
  optin:{
    bad:["Jasnije obećanje: šta tačno dobijaju prijavom","Samo email (bez dodatnih polja)","Dugme i forma vidljivi bez skrolovanja"],
    warn:["Testiraj drugi naslov ili lead magnet","Dodaj broj prijavljenih kao dokaz"],
    good:["Opt-in radi: fokus na konverziju posle prijave"]},
  checkout:{
    bad:["Smanji broj polja na neophodna","Dodaj više načina plaćanja (kartica, Apple/Google Pay)","Garancija povraćaja novca i sigurnosni bedževi pored dugmeta","Kratak rezime ponude + 1–2 testimonijala na checkoutu","Podsetnik za napuštenu korpu (FunnelKit Automations)"],
    warn:["Testiraj jednostrani ili dvostepeni checkout","Dodaj garanciju i rezime ponude","Proveri napuštene korpe i pošalji podsetnik"],
    good:["Checkout radi odlično: ne diraj formu, fokus na bump i upsell"]},
  bump:{
    bad:["Ponudi nešto što direktno dopunjuje glavni proizvod","Cena bumpa ~30–50% glavnog proizvoda","Naslov u formatu „Da, dodaj mi …” + jedna rečenica koristi","Probaj drugi proizvod ili ga isključi ako ne prodaje"],
    warn:["Testiraj nižu cenu ili jači naslov","Dodaj sliku proizvoda i okvir koji privlači pažnju"],
    good:["Odličan bump: kopiraj ga u druge funnele sa sličnom publikom"]},
  upsell:{
    bad:["Upsell treba da bude logičan sledeći korak posle kupovine","Kratak video (1–2 min) koji objašnjava ponudu","Ako je cena visoka: plaćanje na rate ili jači downsell","Dugme „Da” jasno vidljivo na mobilnom"],
    warn:["Testiraj cenu ili dodaj bonus","Dodaj ograničenje: ponuda važi samo na ovoj stranici"],
    good:["Upsell radi: testiraj višu cenu ili dodaj još jedan upsell posle njega"]},
};
TIPS.downsell = TIPS.upsell;

function linkBtns(L, stepId){
  L = L || {};
  let h="";
  if(L.edit) h+=`<a class="act" href="${L.edit}" target="_blank" rel="noopener">Uredi u FunnelKitu ${IC.ext}</a>`;
  if(L.builder) h+=`<a class="act" href="${L.builder}" target="_blank" rel="noopener">Elementor ${IC.ext}</a>`;
  if(L.view) h+=`<a class="act ghost" href="${L.view}" target="_blank" rel="noopener">Otvori stranicu ${IC.ext}</a>`;
  if(stepId) h+=`<button class="act ghost" data-goto="${stepId}">Prikaži na canvasu</button>`;
  return h;
}

function evaluate(f){
  const bad=[],warn=[],good=[];
  f.steps.forEach((s,i)=>{
    const b=BENCH[s.type]; if(!b || !s.views) return;
    const r=pct(s.conversions,s.views), g=grade(s);
    let unit=0; // vrednost jedne dodatne konverzije
    if(s.type==="landing"||s.type==="optin"){
      const next=f.steps.slice(i+1).find(x=>!isOffer(x.type)&&x.type!=="thankyou");
      unit = next && next.views ? f.revenue/next.views : 0;
    } else if(s.type==="checkout"){ unit = f.orders ? f.revenue/f.orders : 0; }
    else unit = s.conversions ? s.revenue/s.conversions : 0;
    const gain = g==="good" ? 0 : Math.max(0, b.good/100*s.views - s.conversions)*unit;
    const item={s,r,b,g,gain,tips:(TIPS[s.type]||{})[g]||[]};
    (g==="bad"?bad:g==="warn"?warn:good).push(item);
  });
  if(!f.steps.some(s=>s.type==="bump") && f.orders>=10)
    warn.push({custom:"Funnel nema order bump",kind:"nobump",text:`${fmt(f.orders)} porudžbina bez bump ponude. Dodaj mali komplementaran proizvod na checkout (obično ga uzme 15–30% kupaca).`,gain:f.orders*.2*Math.max(10,f.aov*.3),links:{edit:f.edit_url}});
  if(!f.steps.some(s=>s.type==="upsell") && f.orders>=10)
    warn.push({custom:"Funnel nema upsell",kind:"noupsell",text:"Kupac je najtopliji odmah posle plaćanja. Dodaj one-click upsell posle checkouta.",gain:f.orders*.08*f.aov,links:{edit:f.edit_url}});
  [...bad,...warn].forEach(it=>scoreItem(it,f));
  const byScore=(a,b)=>b.score-a.score;
  return {bad:bad.sort(byScore),warn:warn.sort(byScore),good:good.sort((a,b)=>b.s.revenue-a.s.revenue)};
}

function itemHTML(it,kind,f){
  if(it.custom) return `<div class="act-item ${kind}">
      <div class="ai-h"><b>${it.custom}</b></div>
      <div class="ai-t">${it.text}</div>
      ${it.gain?`<div class="ai-gain">Potencijal: ~${eur(it.gain)} više u ovom periodu</div>`:""}
      ${it.eff?`<div class="ai-eff"><span class="eff e${Math.ceil(it.eff.k)}">${it.eff.l}</span></div>`:""}
      <div class="ai-btns">${linkBtns(it.links)}${recBtn(f,null,it.text)}</div></div>`;
  const s=it.s;
  return `<div class="act-item ${kind}">
    <div class="ai-h"><span class="type ${s.type}">${TYPE_LABEL[s.type]}</span><b>${s.name}</b></div>
    <div class="ai-m">${p1(it.r)} <span>· cilj ${it.b.good}% · ${fmt(s.conversions)} od ${fmt(s.views)}</span></div>
    ${kind!=="good"&&it.gain>0?`<div class="ai-gain">Potencijal: ~${eur(it.gain)} više u ovom periodu ako dostigne cilj</div>`:""}
    ${kind==="good"&&s.revenue?`<div class="ai-gain good">Doneo ${eur(s.revenue)}</div>`:""}
    ${it.tips.length?`<ul>${it.tips.map(t=>`<li>${t}</li>`).join("")}</ul>`:""}
    ${it.eff?`<div class="ai-eff"><span class="eff e${Math.ceil(it.eff.k)}">${it.eff.l}</span>${it.conf<1?` <span class="muted small">pouzdanost ${it.conf===.4?"niska":"srednja"} (malo podataka)</span>`:""}</div>`:""}
    ${(()=>{const ch=changeFor(f.site.src,f.fid,s.step_id);return ch?`<div class="pr-meas">⏱ meri se od ${ch.date.split("-").reverse().join(".")}: ${verdict(ch).t}</div>`:"";})()}
    <div class="ai-btns">${linkBtns(s.links, s.step_id)}${recBtn(f,s,it.tips[0])}</div>
  </div>`;
}

function nodeHTML(s,f,side){
  const g=grade(s), r=pct(s.conversions,s.views), b=BENCH[s.type];
  const acts=`<div class="n-acts">${linkBtns(s.links)}</div>`;
  if(s.type==="thankyou") return `<div class="node ty" id="node-${s.step_id}">
      <div class="hd"><span class="type thankyou">Thank you</span></div>
      <div class="n">${s.name}</div>
      <div style="color:var(--muted);font-size:13px">Ne donosi prihod · kraj funnela</div>
      <div class="rows"><span>Pregledi</span><span>${fmt(s.views)}</span></div>${acts}</div>`;
  const col=g==="bad"?"var(--bad)":g==="good"?"var(--good)":"var(--warn)";
  return `<div class="node ${side?"side":""} ${g||""}" id="node-${s.step_id}">
    <div class="hd"><span class="type ${s.type}">${TYPE_LABEL[s.type]}</span>
      ${g==="bad"?`<span class="flag bad" style="position:static">ne valja</span>`:g==="warn"?`<span class="flag warn" style="position:static">može bolje</span>`:g==="good"?`<span class="flag good" style="position:static">radi dobro</span>`:""}</div>
    <div class="n">${s.name}</div>
    <div class="rev">${s.revenue?eur(s.revenue):"<span style='color:var(--muted);font-size:14px;font-weight:400'>bez direktnog prihoda</span>"}</div>
    <div class="rows">
      <span>${isOffer(s.type)?"Ponuđeno":"Pregledi"}</span><span>${s.views?fmt(s.views):"—"}</span>
      ${b?`<span>${b.label[0].toUpperCase()+b.label.slice(1)}</span><span>${fmt(s.conversions)}</span>
      <span>Stopa (cilj ${b.good}%)</span><span style="color:${s.views?col:"var(--muted)"}">${s.views?p1(r):"—"}</span>`:""}
      ${s.revenue?`<span>Udeo u prihodu</span><span>${p1(pct(s.revenue,f.revenue))}</span>`:""}
      ${s.revenue&&s.conversions?`<span>Po kupcu</span><span>${eur(s.revenue/s.conversions)}</span>`:""}
    </div>
    ${b&&s.views?`<div class="meter"><i style="width:${Math.min(100,r/b.good*100)}%;background:${col}"></i></div>`:""}
    ${acts}
  </div>`;
}

function connHTML(prev,cur){
  let pill;
  if(["upsell","downsell"].includes(prev.type)){
    pill = cur.type==="downsell" ? `<b>${fmt(cur.views)}</b>odbilo ponudu → downsell` : `kraj ponuda`;
  } else if(!cur.views || !prev.views){
    pill=`nema podataka o pregledima`;
  } else if(cur.views<prev.views){
    const d=100-pct(cur.views,prev.views);
    pill=`<b class="${d>80?"bad-t":d>60?"warn-t":"good-t"}">−${p1(d)}</b>${fmt(prev.views-cur.views)} otpada`;
  } else pill=`<b>${fmt(cur.views)}</b>nastavlja dalje`;
  return `<div class="frow"><div></div><div class="vconn"><div class="ln"></div><div class="pill">${pill}</div><div class="ln"></div><div class="tip"></div></div><div></div></div>`;
}

function renderDetail(f){
  REC=[];
  const el=document.getElementById("detail");
  const main=[]; f.steps.forEach(s=>{ if(s.type==="bump"&&main.length) main[main.length-1].bumps.push(s); else main.push({...s,bumps:[]}); });
  let flow="";
  main.forEach((s,i)=>{
    if(i>0) flow+=connHTML(main[i-1],s);
    const side=s.bumps.length?`<div class="side"><div class="hconn"></div><div class="side-col">${s.bumps.map(b=>nodeHTML(b,f,true)).join("")}</div></div>`:"<div></div>";
    flow+=`<div class="frow"><div></div><div class="mainc">${nodeHTML(s,f,false)}<div class="fill"></div></div>${side}</div>`;
  });

  const E=evaluate(f);
  const totalGain=[...E.bad,...E.warn].reduce((a,x)=>a+(x.gain||0),0);
  const col=(kind,title,list,empty)=>`<div class="board-col ${kind}">
      <div class="bc-h"><span>${title}</span><span class="cnt">${list.length}</span></div>
      ${list.length?list.map(it=>itemHTML(it,kind,f)).join(""):`<div class="act-empty">${empty}</div>`}
    </div>`;
  const revSteps=f.steps.filter(s=>s.revenue).sort((a,b)=>b.revenue-a.revenue);

  el.innerHTML=`
    <div class="dhead"><button class="back" id="backBtn">${IC.arrowL}Svi funneli</button>
      <div style="flex:1"><h2>${f.name}</h2><span class="site-tag">${f.site.name} · ${f.site.url} · ${f.steps.length} aktivnih koraka</span></div>
      ${recBtn(f,null,null,"Zabeleži izmenu")}
      ${f.edit_url?`<a class="act" href="${f.edit_url}" target="_blank" rel="noopener">Otvori u FunnelKitu ${IC.ext}</a>`:""}</div>
    <section class="kpis">
      ${[["Prihod",eur(f.revenue)],["Porudžbine",fmt(f.orders)],["Konverzija",p1(f.cr)],["AOV",eur(f.aov)],["Po posetiocu",money2(f.rpv)],["Bump + upsell",p1(pct(f.extra,f.revenue))]]
        .map(([l,v])=>`<div class="kpi"><div class="l">${l}</div><div class="v">${v}</div></div>`).join("")}
    </section>
    <div class="card" style="margin-bottom:16px">
      <h2>Plan akcije ${totalGain>0?`<span class="badge">ukupan potencijal ~${eur(totalGain)} u ovom periodu</span>`:""}</h2>
      <div class="board">
        ${col("bad","Ne valja",E.bad,"Nema koraka koji ozbiljno curi.")}
        ${col("warn","Može bolje",E.warn,"Ništa posebno za unapređenje.")}
        ${col("good","Radi dobro",E.good,"Još nijedan korak nije na cilju.")}
      </div>
    </div>
    <section class="card" id="dchanges" style="margin-bottom:16px"></section>
    <div class="dlayout">
      <div class="canvas" id="canvas">
        <div class="zoom"><button data-z="-" aria-label="Umanji">${IC.minus}</button><button data-z="0" aria-label="Vrati zum">${IC.undo}</button><button data-z="+" aria-label="Uvećaj">${IC.plus}</button></div>
        <div class="flow" style="transform:scale(${state.zoom})">${flow}</div>
      </div>
      <div class="card"><h2>Odakle dolazi novac</h2>
        ${revSteps.length?revSteps.map(s=>`<div style="margin-bottom:10px"><div style="display:flex;justify-content:space-between;gap:8px;font-size:13px"><span><span class="type ${s.type}" style="margin:0 6px 0 0">${TYPE_LABEL[s.type]}</span>${s.name}</span><b style="white-space:nowrap">${eur(s.revenue)}</b></div>
          <div class="bar"><i style="width:${pct(s.revenue,f.revenue)}%"></i></div></div>`).join(""):`<div class="act-empty">Nema prihoda u ovom periodu.</div>`}
      </div>
    </div>`;
  renderChangesSection(document.getElementById("dchanges"), CHANGES.filter(c=>c.src===f.site.src && +c.funnel_id===+f.fid), "Za ovaj funnel još nema zabeleženih izmena. Posle svake izmene klikni „Zabeleži izmenu” da bi video da li je vredela.");
  bindRec(el);
  document.getElementById("backBtn").onclick=()=>go(null);
  el.querySelectorAll(".zoom button").forEach(b=>b.onclick=()=>{
    const z=b.dataset.z; state.zoom = z==="0"?1:Math.max(.5,Math.min(1.5,state.zoom+(z==="+"?.1:-.1)));
    el.querySelector(".flow").style.transform=`scale(${state.zoom})`;
  });
  el.querySelectorAll("[data-goto]").forEach(b=>b.onclick=()=>{
    const n=document.getElementById("node-"+b.dataset.goto); if(!n) return;
    n.scrollIntoView({behavior:"smooth",block:"center"});
    n.classList.remove("flash"); void n.offsetWidth; n.classList.add("flash");
  });
}

/* ================= PRIORITETI + MERENJE IZMENA ================= */
const EFFORT = {
  bump:{k:1,l:"Brzo · ~1h"}, nobump:{k:1.5,l:"Brzo · ~2h"},
  landing:{k:2,l:"Srednje · pola dana"}, optin:{k:2,l:"Srednje · pola dana"}, checkout:{k:2,l:"Srednje · pola dana"},
  upsell:{k:2,l:"Srednje · pola dana"}, downsell:{k:2,l:"Srednje · pola dana"},
  noupsell:{k:3,l:"Zahtevnije · 1–2 dana"},
};
/* Koliko verujemo brojkama: malo pregleda = manja pouzdanost */
const confidence = n => n>=300 ? 1 : n>=100 ? .7 : .4;

function scoreItem(it,f){
  it.eff = EFFORT[it.kind || (it.s && it.s.type)] || {k:2,l:"Srednje"};
  it.conf = it.custom ? (f.orders>=50?1:.7) : confidence(it.s.views);
  it.score = (it.gain||0) * it.conf / it.eff.k;
  it.f = f;
  return it;
}

function priorities(F){
  const out=[];
  F.forEach(f=>{ const E=evaluate(f); [...E.bad,...E.warn].forEach(it=>{ if(it.gain>0) out.push(it); }); });
  return out.sort((a,b)=>b.score-a.score);
}

/* ---------- registar dugmića "Zabeleži izmenu" ---------- */
let REC=[];
function recBtn(f, s, hint, label){
  REC.push({f, s, hint});
  return `<button class="act rec" data-rec="${REC.length-1}">${IC.pen}${label||"Zabeleži izmenu"}</button>`;
}
function bindRec(root){
  root.querySelectorAll("[data-rec]").forEach(b=>b.onclick=()=>openRecord(REC[+b.dataset.rec]));
}

/* ---------- izmene: učitavanje ---------- */
let CHANGES=[];
async function loadChanges(){
  if(!FDASH.changesApi) return;
  try{
    const r=await fetch(FDASH.changesApi,{headers:{"X-WP-Nonce":FDASH.nonce},credentials:"same-origin"});
    const j=await r.json();
    CHANGES = Array.isArray(j) ? j.map(c=>({...c, note:esc(c.note), funnel_name:esc(c.funnel_name), step_name:esc(c.step_name), site_name:esc(c.site_name), user:(c.user&&c.user!=="false")?esc(c.user):"", step_type:String(c.step_type||"").replace(/[^a-z]/g,""), id:String(c.id).replace(/[^A-Za-z0-9-]/g,"")})) : [];
  }catch(e){ CHANGES=[]; }
  if(DATA) render();
}
function changeFor(src,fid,stepId){
  return CHANGES.find(c=>c.src===src && +c.funnel_id===+fid && (+c.step_id===+(stepId||0)));
}

/* ---------- dijalog ---------- */
function openRecord(o){
  const f=o.f, s=o.s;
  const today=new Date(); const iso=today.getFullYear()+"-"+String(today.getMonth()+1).padStart(2,"0")+"-"+String(today.getDate()).padStart(2,"0");
  const steps=f.steps.filter(x=>x.type!=="thankyou");
  const wrap=document.createElement("div"); wrap.className="fd-modal";
  wrap.innerHTML=`<div class="fd-dialog">
    <h2>Zabeleži izmenu</h2>
    <p class="muted">${f.name} · ${f.site.name}</p>
    <label>Šta si menjao</label>
    <select id="recStep"><option value="0">Ceo funnel (npr. dodat bump/upsell, cena, saobraćaj)</option>
      ${steps.map(x=>`<option value="${x.step_id}" ${s&&+s.step_id===+x.step_id?"selected":""}>${TYPE_LABEL[x.type]}: ${x.name}</option>`).join("")}</select>
    <label>Opis izmene</label>
    <textarea id="recNote" rows="3" placeholder="${o.hint?esc(o.hint):"npr. Novi naslov na landingu, dodata garancija na checkout…"}"></textarea>
    <label>Datum izmene</label>
    <input type="date" id="recDate" value="${iso}" max="${iso}">
    <p class="muted small">Dashboard poredi isti broj dana pre i posle ovog datuma (do 28 dana), bez samog dana izmene. Prva poređenja vidiš sutra, a pouzdan zaključak posle oko 7 dana.</p>
    <div class="fd-dlg-btns"><button class="act ghost" id="recCancel">Otkaži</button><button class="act" id="recSave">Sačuvaj i počni merenje</button></div>
  </div>`;
  document.getElementById("fdash-app").appendChild(wrap);
  const close=()=>wrap.remove();
  wrap.onclick=e=>{ if(e.target===wrap) close(); };
  wrap.querySelector("#recCancel").onclick=close;
  wrap.querySelector("#recSave").onclick=async()=>{
    const note=wrap.querySelector("#recNote").value.trim();
    if(!note){ wrap.querySelector("#recNote").focus(); return; }
    const sid=+wrap.querySelector("#recStep").value;
    const st=f.steps.find(x=>+x.step_id===sid);
    const btn=wrap.querySelector("#recSave"); btn.disabled=true; btn.textContent="Čuvam…";
    const body={src:f.site.src, site_name:unesc(f.site.name), funnel_id:f.fid, funnel_name:unesc(f.name), step_id:sid, step_type:st?st.type:"", step_name:st?unesc(st.name):"", note, date:wrap.querySelector("#recDate").value};
    try{
      const r=await fetch(FDASH.changesApi,{method:"POST",headers:{"X-WP-Nonce":FDASH.nonce,"Content-Type":"application/json"},credentials:"same-origin",body:JSON.stringify(body)});
      if(!r.ok){ const j=await r.json().catch(()=>({})); throw new Error(j.message||("HTTP "+r.status)); }
      close(); await loadChanges();
    }catch(e){ btn.disabled=false; btn.textContent="Sačuvaj i počni merenje"; alert("Nije sačuvano: "+e.message); }
  };
  wrap.querySelector("#recNote").focus();
}
const unesc = s => { const t=document.createElement("textarea"); t.innerHTML=s; return t.value; };

/* ---------- presuda: da li je vredelo ---------- */
function verdict(c){
  if(c.status==="pending") return {k:"wait",t:"Merenje počinje sutra"};
  if(c.status!=="ok") return {k:"bad",t:"Greška: "+esc(c.message||"")};
  const L=c.window_days, b=c.before, a=c.after;
  if(c.step_id && b.step.views>0 && a.step.views>0){
    const p1=b.step.conversions/b.step.views, p2=a.step.conversions/a.step.views;
    const p=(b.step.conversions+a.step.conversions)/(b.step.views+a.step.views);
    const se=Math.sqrt(p*(1-p)*(1/b.step.views+1/a.step.views));
    const z=se?(p2-p1)/se:0;
    const rel=p1?(p2-p1)/p1*100:0;
    if(L<7 || b.step.views<50 || a.step.views<50) return {k:"wait",t:`Prerano za zaključak (${L} ${L===1?"dan":"dana"}, treba bar 7)`,rel};
    if(z>=1.96) return {k:"good",t:"Vredelo je",rel};
    if(z<=-1.96) return {k:"bad",t:"Gore je nego pre (razmisli da vratiš staro)",rel};
    return {k:"neutral",t:"Nema jasne razlike",rel};
  }
  const d=b.funnel.revenue ? (a.funnel.revenue-b.funnel.revenue)/b.funnel.revenue*100 : (a.funnel.revenue>0?100:0);
  if(L<7) return {k:"wait",t:`Prerano za zaključak (${L} ${L===1?"dan":"dana"}, treba bar 7)`,rel:d};
  if(d>=15) return {k:"good",t:"Vredelo je (prihod funnela veći)",rel:d};
  if(d<=-15) return {k:"bad",t:"Prihod funnela pao",rel:d};
  return {k:"neutral",t:"Nema jasne razlike",rel:d};
}

function deltaCell(a,b,fmtFn,isRate){
  if(!b && !a) return `<td class="num">—</td>`;
  const d=a-b, rel=b?d/b*100:null;
  const cls=d>0?"good-t":d<0?"bad-t":"";
  const txt=isRate ? `${d>=0?"+":""}${d.toFixed(1).replace(".",",")} p.p.` : `${d>=0?"+":""}${fmtFn(d)}${rel!==null?` (${rel>=0?"+":""}${rel.toFixed(0)}%)`:""}`;
  return `<td class="num ${cls}">${txt}</td>`;
}

function changeHTML(c){
  const v=verdict(c);
  const dt=c.date.split("-").reverse().join(".");
  let table="";
  if(c.status==="ok"){
    const b=c.before,a=c.after,L=c.window_days;
    const rows=[];
    if(c.step_id && (b.step.views||a.step.views)) rows.push(["Stopa konverzije koraka", p1(pct(b.step.conversions,b.step.views)), p1(pct(a.step.conversions,a.step.views)), deltaCell(pct(a.step.conversions,a.step.views),pct(b.step.conversions,b.step.views),null,true)]);
    if(c.step_id) rows.push([c.step_type==="checkout"?"Porudžbine (korak)":"Konverzije koraka", fmt(b.step.conversions), fmt(a.step.conversions), deltaCell(a.step.conversions,b.step.conversions,fmt)]);
    if(c.step_id && (b.step.revenue||a.step.revenue)) rows.push(["Prihod koraka", eur(b.step.revenue), eur(a.step.revenue), deltaCell(a.step.revenue,b.step.revenue,eur)]);
    rows.push(["Prihod funnela", eur(b.funnel.revenue), eur(a.funnel.revenue), deltaCell(a.funnel.revenue,b.funnel.revenue,eur)]);
    rows.push(["Porudžbine funnela", fmt(b.funnel.orders), fmt(a.funnel.orders), deltaCell(a.funnel.orders,b.funnel.orders,fmt)]);
    if(b.funnel.entry && a.funnel.entry) rows.push(["Prihod po posetiocu", money2(b.funnel.revenue/b.funnel.entry), money2(a.funnel.revenue/a.funnel.entry), deltaCell(a.funnel.revenue/a.funnel.entry,b.funnel.revenue/b.funnel.entry,money2)]);
    const perDay=(a.funnel.revenue-b.funnel.revenue)/L;
    const traffic = b.funnel.entry && a.funnel.entry ? (a.funnel.entry-b.funnel.entry)/b.funnel.entry*100 : 0;
    table=`<table class="cmp"><tr><th>Metrika</th><th class="num">Pre (${L} d)</th><th class="num">Posle (${L} d)</th><th class="num">Promena</th></tr>
      ${rows.map(r=>`<tr><td>${r[0]}</td><td class="num">${r[1]}</td><td class="num">${r[2]}</td>${r[3]}</tr>`).join("")}</table>
      <div class="cmp-foot">${b.from.split("-").reverse().join(".")}–${b.to.split("-").reverse().join(".")} vs ${a.from.split("-").reverse().join(".")}–${a.to.split("-").reverse().join(".")}
      · <b class="${perDay>=0?"good-t":"bad-t"}">${perDay>=0?"+":""}${eur(perDay)}/dan</b> prihoda funnela
      ${Math.abs(traffic)>30?` · <span class="warn-t">saobraćaj se promenio ${traffic>0?"+":""}${traffic.toFixed(0)}%, više veruj stopama nego ukupnim brojevima</span>`:""}</div>`;
  } else if(c.status==="pending"){
    table=`<div class="cmp-foot">Izmena je zabeležena danas. Od sutra dashboard poredi isti broj dana pre i posle.</div>`;
  }
  return `<div class="chg ${v.k}">
    <div class="chg-h">
      <div><span class="verdict ${v.k}">${v.t}</span>
        <b>${c.step_name?`${TYPE_LABEL[c.step_type]||""}: ${c.step_name}`:"Ceo funnel"}</b>
        <span class="site-tag">${c.funnel_name} · ${c.site_name} · izmena ${dt}${c.user?" · "+c.user:""}</span></div>
      <button class="x" data-del="${c.id}" title="Obriši merenje">×</button>
    </div>
    <div class="chg-note">„${c.note}”</div>
    ${table}
  </div>`;
}

function bindChanges(root){
  root.querySelectorAll("[data-del]").forEach(b=>b.onclick=async()=>{
    if(!confirm("Obrisati ovo merenje?")) return;
    await fetch(FDASH.changesApi+"/"+b.dataset.del,{method:"DELETE",headers:{"X-WP-Nonce":FDASH.nonce},credentials:"same-origin"});
    loadChanges();
  });
}

/* ---------- pregled: prioriteti ---------- */
let showAllPrio=false;
function renderPriorities(F){
  const el=document.getElementById("prio");
  const P=priorities(F);
  if(!P.length){ el.innerHTML=`<h2>Prioriteti</h2><div class="act-empty">Nema koraka ispod cilja u ovom periodu.</div>`; return; }
  const list=showAllPrio?P:P.slice(0,8);
  const total=P.reduce((a,x)=>a+x.gain,0);
  el.innerHTML=`<h2>Šta prvo popraviti <span class="badge">ukupan potencijal ~${eur(total)} u ovom periodu</span></h2>
    <p class="muted small" style="margin:-4px 0 12px">Redosled: koliko novca donosi × koliko verujemo brojkama ÷ koliko je posla. Na vrhu su brze izmene koje najviše donose.</p>
    <div class="prio-list">${list.map((it,i)=>{
      const f=it.f, s=it.s, ch=changeFor(f.site.src,f.fid,s?s.step_id:0);
      const title = it.custom ? `<b>${it.custom}</b>` : `<span class="type ${s.type}">${TYPE_LABEL[s.type]}</span><b>${s.name}</b>`;
      const metric = it.custom ? `<span class="muted">${fmt(f.orders)} porudžbina bez ponude</span>` : `<span class="${it.g==="bad"?"bad-t":"warn-t"}">${p1(it.r)}</span> <span class="muted">→ cilj ${it.b.good}%</span>`;
      return `<div class="prio-row">
        <div class="pr-rank">${i+1}</div>
        <div class="pr-main"><div class="ai-h">${title}</div>
          <div class="site-tag">${f.name} · ${f.site.name}${it.conf<1?` · <span title="malo podataka">pouzdanost ${it.conf===.4?"niska":"srednja"}</span>`:""}</div>
          ${ch?`<div class="pr-meas">⏱ meri se od ${ch.date.split("-").reverse().join(".")}: ${verdict(ch).t}</div>`:""}</div>
        <div class="pr-metric">${metric}</div>
        <div class="pr-eff"><span class="eff e${Math.ceil(it.eff.k)}">${it.eff.l}</span></div>
        <div class="pr-gain">+${eur(it.gain)}<span>potencijal</span></div>
        <div class="pr-btns">${linkBtns(it.custom?it.links:s.links)}<button class="act ghost" data-open="${f.id}">Funnel</button>${recBtn(f,s,it.tips&&it.tips[0]||it.text,"Zabeleži")}</div>
      </div>`;}).join("")}</div>
    ${P.length>8?`<button class="act ghost" id="prioMore" style="margin-top:10px">${showAllPrio?"Prikaži manje":"Prikaži sve ("+P.length+")"}</button>`:""}`;
  const more=document.getElementById("prioMore"); if(more) more.onclick=()=>{showAllPrio=!showAllPrio; render();};
  el.querySelectorAll("[data-open]").forEach(b=>b.onclick=()=>go(b.dataset.open));
  bindRec(el);
}

let showAllChg=false;
function renderChangesSection(el, list, emptyText){
  const shown=showAllChg?list:list.slice(0,4);
  el.innerHTML=`<h2>Merenje izmena <span class="badge">pre i posle</span></h2>
    ${list.length?`<div class="chg-list">${shown.map(changeHTML).join("")}</div>`:`<div class="act-empty">${emptyText}</div>`}
    ${list.length>4?`<button class="act ghost chg-more" style="margin-top:10px">${showAllChg?"Prikaži manje":"Prikaži sve ("+list.length+")"}</button>`:""}`;
  const m=el.querySelector(".chg-more"); if(m) m.onclick=()=>{showAllChg=!showAllChg; render();};
  bindChanges(el);
}

function renderErrors(){
  const el=document.getElementById("fdErrors");
  const E=(DATA&&DATA.errors)||[];
  el.innerHTML=E.length?`<div class="fd-errors"><b>Neki sajtovi nisu učitani:</b><br>${E.map(e=>`${esc(e.site)}: ${esc(e.message)}`).join("<br>")}<br>${FDASH.settingsUrl?`<a href="${FDASH.settingsUrl}">Proveri podešavanja sajtova →</a>`:"Javi administratoru."}</div>`:"";
}
const safeUrl = u => (typeof u==="string" && /^https?:\/\//i.test(u)) ? esc(u) : "";
const esc = s => String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));

function render(){
  if(!DATA){ return; }
  renderControls(); renderErrors();
  const m=state.view?[0,state.view]:null;
  const ov=document.getElementById("overview"), dt=document.getElementById("detail"), mv=document.getElementById("mapView");
  mv.style.display="none";
  if(m){
    const siteSave=state.site; state.site="all";
    const f=scaled().find(x=>x.id===m[1]); state.site=siteSave;
    if(f){ ov.style.display="none"; dt.style.display="block"; renderDetail(f);
      document.getElementById("updated").textContent="· "+unesc(f.name)+" · "+periodLabel(); return; }
  }
  ov.style.display="block"; dt.style.display="none";
  const F=scaled();
  if(F.length && state.mode==="map" && typeof renderMap==="function"){
    ov.style.display="none"; mv.style.display="block"; renderMap(F);
    document.getElementById("updated").textContent="· "+periodLabel()+(DATA.cached?" · iz keša":"");
    return;
  }
  if(!F.length){
    ov.innerHTML=`<div class="fd-empty">Nema pronađenih funnela za ovaj period.<br><br>${FDASH.settingsUrl?`Proveri da li je FunnelKit aktivan i da li su sajtovi dodati u <a href="${FDASH.settingsUrl}">podešavanjima</a>.`:"Probaj drugi period."}</div>`;
    shellNeeded=true;
  } else {
    if(shellNeeded){ shell(); shellNeeded=false; renderControls(); renderErrors(); document.getElementById("overview").style.display="block"; document.getElementById("detail").style.display="none"; }
    REC=[]; renderKPIs(F); renderPriorities(F); renderChangesSection(document.getElementById("changes"), CHANGES, "Još nema zabeleženih izmena. Kad nešto promeniš na funnelu, klikni „Zabeleži izmenu” pored tog koraka i ovde ćeš videti da li je izmena vredela."); renderLeader(F); renderInsights(F); renderFunnels(F);
  }
  document.getElementById("updated").textContent="· "+periodLabel()+(DATA.cached?" · iz keša":"");
}
let shellNeeded=false;
const fromHash=()=>{const h=location.hash.match(/^#\/funnel\/([\w-]+)/);state.view=h?h[1]:null;};
window.addEventListener("popstate",()=>{fromHash();render()});
fromHash();
shell();
(function initPeriod(){
  let saved=null; try{ saved=JSON.parse(localStorage.getItem("fdash_period")||"null"); }catch(e){}
  if(saved && saved.k && saved.k!=="custom"){ const [from,to]=presetRange(saved.k); state.period={k:saved.k,from,to}; }
  else if(saved && saved.k==="custom" && saved.from && saved.to){ state.period=saved; }
  else { const [from,to]=presetRange("30"); state.period={k:"30",from,to}; }
})();
load();
loadChanges();
