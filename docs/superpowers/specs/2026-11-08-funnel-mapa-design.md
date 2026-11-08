# Funnel mapa – dizajn

Datum: 2026-11-08 · Grana: `feature/funnel-mapa`

## Cilj
Prvi ekran dashboarda postaje jednostavna **mapa funnela** umesto KPI kartica i tabela.
Svaki funnel je jedan red: stranice (sales page → checkout → upsell → hvala) kao sličice pravih
stranica, povezane animiranim strelicama. Prihod funnela je krupno u redu. Klik na stranicu otvara
panel sa detaljima; dugme **Analiza** crvenom strelicom pokazuje gde funnel gubi najviše novca.

## Delovi
- **Demo podaci** (`lib/demo.ts`): kad nema `FDASH_SITES` i radi se lokalno, dashboard prikazuje
  4 funnela sa pravim stranicama sa nemanjaantic.com i izmišljenim brojevima (jasno označeno „DEMO”).
- **Screenshot servis** (`lib/shots.ts`, `app/api/shot/route.ts`): server otvori stranicu u headless
  Chrome-u (lokalno `puppeteer`, na Vercelu `puppeteer-core` + `@sparticuz/chromium`), ukloni
  plutajuće elemente (chat, popupi, kolačići) i sačuva JPEG gornjeg dela stranice. Keš 24h;
  „Osveži sliku” pravi novu.
  - Slikaju se samo adrese sa sajtova iz liste (zaštita od zloupotrebe).
  - **Ručna slika** (upload) uvek ima prednost; može da se ukloni i vrati automatska.
- **Mapa** (`public/map.js` + stilovi u `app/dashboard.css`): novi glavni prikaz. Prekidač
  „Mapa / Detaljno” u zaglavlju; „Detaljno” je postojeći pregled. Klik na naziv funnela otvara
  postojeći detaljni ekran funnela.
  - Order bump visi ispod checkouta; upsell/downsell su u nizu.
  - Iznad strelice: procenat koji ide dalje. Ispod stranice: broj posetilaca i prihod koraka.
  - Analiza koristi postojeću `evaluate()` logiku (benchmark po tipu koraka) i bira korak sa
    najvećim potencijalom zarade.

## Otvoreno (posle pregleda)
- Na Vercelu keš ide u `/tmp` (privremeno). Za produkciju slike i ručne upload-e treba čuvati u
  Supabase Storage.
- Prave podatke dobijamo kad stignu ključevi sajtova (`FDASH_SITES`).
