# Status: Funnel Dashboard (web)
Ažurirano: 2026-11-09
Faza: uživo

## Gde smo stali
- Kompletan redizajn (pravac „tabla”): svetla tačkasta pozadina, bele ograđene kartice funnela, Inter,
  prave ikonice umesto emojija, zaglavlje sa menijima za sajt i period, dugme Analiza i meni naloga.
  Isti stil važi za Mapu, Detaljno, detalj funnela, dijaloge i prijavu.
- Ispod checkouta piše broj order bumpova i za svaki: naziv, % koji uzme, broj i prihod.
- 2026-11-09: PR #1 spojen na `main` i objavljen na Vercel (produkcija). Mapa i redizajn su uživo.
- Nova **mapa funnela** je glavni ekran: svaki funnel je red pravih stranica (screenshot sa sajta),
  povezanih animiranim strelicama, sa prihodom, posetiocima i konverzijom. Order bump visi ispod checkouta.
- Dugme **Analiza** crvenom strelicom označi najveću šansu u svakom funnelu i izlista top 5 sa strane.
- Klik na stranicu otvara panel: velika slika, brojevi, cilj, saveti, „Zabeleži izmenu”,
  osveži sliku / ubaci svoju sliku / vrati automatsku.
- Stari prikaz je i dalje tu pod „Detaljno”.
- Lokalno bez ključeva radi sa DEMO podacima (prave stranice sa nemanjaantic.com, izmišljeni brojevi).

## Sledeći korak
- Developer proverava na produkciji da li se sličice stranica prave (uputstvo u komentaru na PR #1).
  Ako piše „Slika nije dostupna”, treba logovi `/api/shot` sa Vercela.
- Screenshotove i ručne slike čuvati u Supabase Storage (sada su u `/tmp` i brišu se posle restarta).

## Šta fali od Vladimira
- Potvrda od developera da sličice rade na produkciji.
- Ključevi sajtova (`FDASH_SITES`) da bi mapa radila sa pravim brojevima.

## Otvorena pitanja / rizici
- Upsell i thank-you stranice nekad traže porudžbinu; tada treba ručno ubaciti sliku.
- Prvo slikanje traje ~10 s po stranici (posle je keširano 24h).
