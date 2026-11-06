"use client";
import { createBrowserClient } from "@supabase/ssr";
import { useState } from "react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setBusy(true);
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) {
      if (process.env.NODE_ENV === "production") { setErr("Supabase još nije podešen (NEXT_PUBLIC_SUPABASE_URL / ANON_KEY)."); setBusy(false); return; }
      window.location.href = "/"; return; // lokalni razvoj bez prijave
    }
    const sb = createBrowserClient(url, key);
    const { error } = await sb.auth.signInWithPassword({ email: email.trim(), password });
    if (error) { setErr("Pogrešan email ili lozinka."); setBusy(false); return; }
    window.location.href = "/";
  }

  return (
    <div id="fdash-app" className="standalone" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      <form onSubmit={submit} className="fd-dialog" style={{ width: 360 }}>
        <h2>Funnel Dashboard</h2>
        <p className="muted small">Prijavi se nalogom koji ti je dao administrator.</p>
        <label>Email</label>
        <input type="email" required autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} />
        <label>Lozinka</label>
        <input type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        {err && <p className="bad-t small" style={{ marginTop: 10 }}>{err}</p>}
        <div className="fd-dlg-btns">
          <button className="act" type="submit" disabled={busy}>{busy ? "Prijavljujem…" : "Prijavi se"}</button>
        </div>
      </form>
    </div>
  );
}
