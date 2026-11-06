import { NextRequest, NextResponse } from "next/server";
import { deleteChange } from "@/lib/changes";
import { currentUser } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!(await currentUser())) return NextResponse.json({ message: "Prijavi se ponovo." }, { status: 401 });
  const { id } = await ctx.params;
  if (!/^[A-Za-z0-9-]{1,64}$/.test(id)) return NextResponse.json({ message: "Pogrešan ID." }, { status: 400 });
  try {
    return NextResponse.json(await deleteChange(id));
  } catch (e: any) {
    return NextResponse.json({ message: e?.message || "Greška" }, { status: 500 });
  }
}
