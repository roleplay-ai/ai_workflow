import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { convertPdfToImages } from "@/lib/pdfToImages";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

/** Natural sort — "Slide2" before "Slide10" */
function naturalSort(a: string, b: string): number {
  const chunk = (s: string) =>
    s.toLowerCase().split(/(\d+)/).map((p) => (/^\d+$/.test(p) ? parseInt(p, 10) : p));
  const pa = chunk(a);
  const pb = chunk(b);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const ca = pa[i] ?? "";
    const cb = pb[i] ?? "";
    if (ca < cb) return -1;
    if (ca > cb) return 1;
  }
  return 0;
}

export async function POST(req: Request) {
  await mkdir(UPLOAD_DIR, { recursive: true });

  const formData = await req.formData();
  const files = formData.getAll("files") as File[];

  if (!files.length) {
    return NextResponse.json({ error: "No files provided" }, { status: 400 });
  }

  const urls: string[] = [];
  const names: string[] = [];

  for (const file of files) {
    const arrayBuf = await file.arrayBuffer();
    const buffer   = Buffer.from(arrayBuf);
    const lname    = file.name.toLowerCase();

    if (lname.endsWith(".pdf")) {
      // ── PDF → render each page as PNG ──────────────────────────────────────
      let pages: Buffer[];
      try {
        pages = await convertPdfToImages(buffer);
      } catch (err: any) {
        return NextResponse.json(
          { error: `PDF render failed: ${err.message ?? "unknown error"}` },
          { status: 500 }
        );
      }

      for (let i = 0; i < pages.length; i++) {
        const slideNum = String(i + 1).padStart(3, "0");
        const filename = `${Date.now()}_slide${slideNum}.png`;
        await writeFile(path.join(UPLOAD_DIR, filename), pages[i]);
        urls.push(`/uploads/${filename}`);
        names.push(`Page ${i + 1}`);
      }

    } else if (lname.endsWith(".pptx")) {
      return NextResponse.json(
        {
          error:
            "PPTX direct upload is not supported. Export your slides as a PDF or PNG images from PowerPoint first:\n" +
            "• PDF: File → Export → Create PDF/XPS\n" +
            "• PNG: File → Export → Export to PNG → Every Slide",
        },
        { status: 400 }
      );

    } else {
      // ── Direct image upload ──────────────────────────────────────────────
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const filename = `${Date.now()}_${safeName}`;
      await writeFile(path.join(UPLOAD_DIR, filename), buffer);
      urls.push(`/uploads/${filename}`);
      names.push(file.name);
    }
  }

  // If multiple image files were uploaded, sort by original filename
  if (files.length > 1 && !files[0].name.toLowerCase().endsWith(".pdf")) {
    const combined = urls.map((url, i) => ({ url, name: names[i] }));
    combined.sort((a, b) => naturalSort(a.name, b.name));
    urls.length = 0;
    names.length = 0;
    combined.forEach(({ url, name }) => { urls.push(url); names.push(name); });
  }

  return NextResponse.json({ urls, names });
}
