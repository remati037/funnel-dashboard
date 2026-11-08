# Status: Funnel Dashboard (web)
Ažurirano: 2026-11-08
Faza: razvoj

## Gde smo stali
- Grana `feature/funnel-mapa` (nije na `main`, ništa nije objavljeno na Vercel).
- Nova **mapa funnela** je glavni ekran: svaki funnel je red pravih stranica (screenshot sa sajta),
  povezanih animiranim strelicama, sa prihodom, posetiocima i konverzijom. Order bump visi ispod checkouta.
- Dugme **Analiza** crvenom strelicom označi najveću šansu u svakom funnelu i izlista top 5 sa strane.
- Klik na stranicu otvara panel: velika slika, brojevi, cilj, saveti, „Zabeleži izmenu”,
  osveži sliku / ubaci svoju sliku / vrati automatsku.
- Stari prikaz je i dalje tu pod „Detaljno”.
- Lokalno bez ključeva radi sa DEMO podacima (prave stranice sa nemanjaantic.com, izmišljeni brojevi).

## Sledeći korak
- Vladimir pregleda mapu lokalno i kaže izmene.
- Za produkciju: screenshotove i ručne slike čuvati u Supabase Storage (sada su u `/tmp` na Vercelu)
  i proveriti da headless Chrome (`@sparticuz/chromium`) radi na Vercelu.

## Šta fali od Vladimira
- Pregled i komentari na mapu.
- Ključevi sajtova (`FDASH_SITES`) da bi mapa radila sa pravim brojevima.

## Otvorena pitanja / rizici
- Upsell i thank-you stranice nekad traže porudžbinu; tada treba ručno ubaciti sliku.
- Prvo slikanje traje ~10 s po stranici (posle je keširano 24h).
