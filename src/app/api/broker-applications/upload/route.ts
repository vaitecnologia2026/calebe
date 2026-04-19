import { NextResponse } from "next/server";
import { put } from "@vercel/blob";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_SIZE = 8 * 1024 * 1024; // 8MB
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);

export async function POST(req: Request) {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: "Upload não configurado: defina BLOB_READ_WRITE_TOKEN." },
      { status: 503 }
    );
  }

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Arquivo ausente." }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "Arquivo acima de 8MB." }, { status: 413 });
  }
  if (!ALLOWED.has(file.type)) {
    return NextResponse.json({ error: "Tipo não permitido." }, { status: 415 });
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80);
  const key = `broker-applications/${Date.now()}-${crypto.randomUUID()}-${safeName}`;

  const blob = await put(key, file, {
    access: "public",
    token,
    contentType: file.type,
    addRandomSuffix: false
  });

  return NextResponse.json({ url: blob.url, pathname: blob.pathname });
}
