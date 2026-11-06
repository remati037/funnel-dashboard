import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const sb = await supabaseServer();
  if (sb) await sb.auth.signOut();
  return NextResponse.redirect(new URL("/login", req.url));
}
