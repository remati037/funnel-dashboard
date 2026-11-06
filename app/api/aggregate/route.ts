import { NextRequest, NextResponse } from "next/server";
import { addDays, isYmd, today } from "@/lib/config";
import { aggregate } from "@/lib/sites";
import { currentUser } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  if (!(await currentUser())) return NextResponse.json({ message: "Prijavi se ponovo." }, { status: 401 });
  const q = req.nextUrl.searchParams;
  let to = isYmd(q.get("to")) ? q.get("to")! : today();
  let from = isYmd(q.get("from")) ? q.get("from")! : addDays(to, -29);
  if (from > to) [from, to] = [to, from];
  try {
    return NextResponse.json(await aggregate(from, to, q.get("refresh") === "1"));
  } catch (e: any) {
    return NextResponse.json({ message: e?.message || "Greška" }, { status: 500 });
  }
}
