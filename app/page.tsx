import Script from "next/script";
import { redirect } from "next/navigation";
import { TITLE } from "@/lib/config";
import { currentUser } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function Page() {
  const user = await currentUser();
  if (!user) redirect("/login");
  const cfg = {
    api: "/api/aggregate",
    changesApi: "/api/changes",
    nonce: "",
    settingsUrl: "",
    standalone: true,
    appUrl: "/",
    logoutUrl: "/logout",
    userName: user.email,
    title: TITLE,
  };
  return (
    <>
      <div id="fdash-app" className="standalone">
        <div className="fd-loading">Učitavam podatke sa sajtova…</div>
      </div>
      <script dangerouslySetInnerHTML={{ __html: `var FDASH=${JSON.stringify(cfg).replace(/</g, "\\u003c")};` }} />
      <Script src="/dashboard.js" strategy="afterInteractive" />
    </>
  );
}
