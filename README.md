# Funnel Dashboard (web)

Jedan dashboard za sve FunnelKit funnele sa svih sajtova. Podatke čita sa svakog WordPress sajta
preko plugina **Funnel Dashboard** (konektor), a sve ostalo (prioriteti, merenje izmena, filteri) radi ovde.

- **Hosting:** Vercel (svaki push na `main` se automatski objavi)
- **Login i dnevnik izmena:** Supabase (`supabase.sql`)
- **Sajtovi i ključevi:** env varijabla `FDASH_SITES` (samo na serveru)

## Env varijable
Vidi `.env.example`.
| Ime | Opis |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API → anon / publishable key |
| `FDASH_SITES` | `[{"name":"Antić","url":"https://sajt.rs","key":"KLJUČ","rate":1}, ...]` |
| `FDASH_CURRENCY` | podrazumevano `EUR` |
| `FDASH_TITLE` | naslov dashboarda |
| `FDASH_TZ` | podrazumevano `Europe/Belgrade` |

Posle izmene `NEXT_PUBLIC_*` varijabli treba uraditi Redeploy.

## Lokalno
```bash
npm install
npm run dev   # http://localhost:3100 – bez Supabase env-a radi bez prijave, sa memorijskom bazom
```

## Članovi tima
Supabase → Authentication → Users → Add user (Auto Confirm). Registracija je isključena,
tako da pristup imaju samo nalozi koje dodaš.
