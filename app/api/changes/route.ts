import { NextRequest, NextResponse } from "next/server";
import { addChange, changesWithResults } from "@/lib/changes";
import { currentUser } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET() {
  if (!(await currentUser())) return NextResponse.json({ message: "Prijavi se ponovo." }, { status: 401 });
  try {
    return NextResponse.json(await changesWithResults());
  } catch (e: any) {
    return NextResponse.json({ message: e?.message || "Greška" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ message: "Prijavi se ponovo." }, { status: 401 });
  try {
    return NextResponse.json(await addChange(await req.json(), user.email));
  } catch (e: any) {
    return NextResponse.json({ message: e?.message || "Greška" }, { status: 400 });
  }
}
