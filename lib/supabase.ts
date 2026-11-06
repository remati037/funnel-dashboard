import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { devMode, supabaseConfigured } from "./config";

/** Supabase klijent sa sesijom prijavljenog korisnika (server). */
export async function supabaseServer() {
  if (!supabaseConfigured()) return null;
  const store = await cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          list.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch {
          /* poziv iz server komponente – sesiju osvežava proxy */
        }
      },
    },
  });
}

export type User = { email: string };

/** Prijavljeni korisnik ili null. */
export async function currentUser(): Promise<User | null> {
  if (devMode()) return { email: "dev@localhost" };
  const sb = await supabaseServer();
  if (!sb) return null;
  const { data } = await sb.auth.getUser();
  return data.user ? { email: data.user.email || "" } : null;
}
