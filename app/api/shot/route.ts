import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/supabase";
import { allowedUrl, getShot, removeManual, saveManual } from "@/lib/shots";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

const IMG_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_UPLOAD = 5 * 1024 * 1024;

/** GET /api/shot?url=…[&refresh=1] – slika stranice (ručna ima prednost). */
export async function GET(req: NextRequest) {
  if (!(await currentUser())) return NextResponse.json({ message: "Prijavi se ponovo." }, { status: 401 });
  const u = allowedUrl(req.nextUrl.searchParams.get("url"));
  if (!u) return NextResponse.json({ message: "Adresa nije sa sajtova iz liste." }, { status: 400 });
  try {
    const shot = await getShot(u.toString(), req.nextUrl.searchParams.get("refresh") === "1");
    return new NextResponse(new Uint8Array(shot.body), {
      headers: {
        "Content-Type": shot.type,
        "Cache-Control": "private, max-age=300",
        "X-Shot-Source": shot.manual ? "manual" : "auto",
      },
    });
  } catch (e: any) {
    return NextResponse.json({ message: "Slika nije napravljena: " + (e?.message || "greška") }, { status: 502 });
  }
}

/** POST /api/shot (multipart: url, file) – ručna slika stranice. */
export async function POST(req: NextRequest) {
  if (!(await currentUser())) return NextResponse.json({ message: "Prijavi se ponovo." }, { status: 401 });
  const form = await req.formData();
  const u = allowedUrl(String(form.get("url") || ""));
  const file = form.get("file");
  if (!u) return NextResponse.json({ message: "Adresa nije sa sajtova iz liste." }, { status: 400 });
  if (!(file instanceof File) || !IMG_TYPES.includes(file.type)) return NextResponse.json({ message: "Pošalji JPG, PNG ili WebP sliku." }, { status: 400 });
  if (file.size > MAX_UPLOAD) return NextResponse.json({ message: "Slika je veća od 5 MB." }, { status: 400 });
  await saveManual(u.toString(), Buffer.from(await file.arrayBuffer()), file.type);
  return NextResponse.json({ ok: true });
}

/** DELETE /api/shot?url=… – ukloni ručnu sliku (vraća se automatska). */
export async function DELETE(req: NextRequest) {
  if (!(await currentUser())) return NextResponse.json({ message: "Prijavi se ponovo." }, { status: 401 });
  const u = allowedUrl(req.nextUrl.searchParams.get("url"));
  if (!u) return NextResponse.json({ message: "Adresa nije sa sajtova iz liste." }, { status: 400 });
  await removeManual(u.toString());
  return NextResponse.json({ ok: true });
}
