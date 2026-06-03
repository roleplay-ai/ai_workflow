import { execFile } from "child_process";
import { promisify } from "util";
import { writeFile, readFile, readdir, rm, mkdir } from "fs/promises";
import os from "os";
import path from "path";

const exec = promisify(execFile);

/** Find the LibreOffice binary. Checks common install paths on Windows and Linux/Mac. */
function getSofficePath(): string {
  if (process.platform === "win32") {
    return "C:\\Program Files\\LibreOffice\\program\\soffice.exe";
  }
  if (process.platform === "darwin") {
    return "/Applications/LibreOffice.app/Contents/MacOS/soffice";
  }
  return "soffice"; // Linux — assumes it's on PATH
}

/** Natural sort so slide-001.png < slide-002.png < slide-010.png */
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

/**
 * Converts every slide in a PPTX to a PNG Buffer, in slide order.
 *
 * Pipeline:
 *   1. LibreOffice headless  →  PPTX to PDF (preserves all slide content)
 *   2. pdfjs-dist + @napi-rs/canvas  →  each PDF page rendered to PNG Buffer
 *
 * Throws a friendly error if LibreOffice is not installed.
 */
export async function convertPptxToSlideImages(pptxBuffer: Buffer): Promise<Buffer[]> {
  const soffice = getSofficePath();

  // Verify LibreOffice is reachable before doing any work
  try {
    await exec(soffice, ["--version"], { timeout: 10_000 });
  } catch {
    throw new Error(
      `LibreOffice not found at "${soffice}". ` +
      `Please install LibreOffice from https://www.libreoffice.org/download/libreoffice/ ` +
      `and restart the dev server. Alternatively, export your slides as PNG images directly ` +
      `from PowerPoint (File → Export → Export to PNG) and upload those instead.`
    );
  }

  const id = Math.random().toString(36).slice(2);
  const tmpDir = path.join(os.tmpdir(), `slides_${id}`);
  const outDir = path.join(tmpDir, "out");
  const pptxFile = path.join(tmpDir, "deck.pptx");

  try {
    await mkdir(outDir, { recursive: true });
    await writeFile(pptxFile, pptxBuffer);

    // Step 1 — PPTX → PDF
    await exec(
      soffice,
      ["--headless", "--convert-to", "pdf", "--outdir", outDir, pptxFile],
      { timeout: 120_000 }
    );

    const pdfFile = path.join(outDir, "deck.pdf");
    const pdfBuffer = await readFile(pdfFile);

    // Step 2 — PDF pages → PNG Buffers
    const images = await renderPdfToImages(pdfBuffer);

    if (images.length === 0) {
      throw new Error("PDF was produced but no pages could be rendered.");
    }

    return images;
  } finally {
    await rm(tmpDir, { recursive: true, force: true }).catch(() => {});
  }
}

async function renderPdfToImages(pdfBuffer: Buffer): Promise<Buffer[]> {
  // Dynamic imports — these are optional heavy deps, only loaded when needed
  const { createCanvas } = await import("@napi-rs/canvas");

  // pdfjs-dist legacy build works in Node.js without a DOM
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs" as string);
  (pdfjs as any).GlobalWorkerOptions.workerSrc = false; // disable worker thread in Node

  const loadingTask = (pdfjs as any).getDocument({
    data: new Uint8Array(pdfBuffer),
    useSystemFonts: true,
    disableWorker: true,
  });

  const pdfDoc = await loadingTask.promise;
  const results: Buffer[] = [];

  for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
    const page = await pdfDoc.getPage(pageNum);
    const scale = 2.0; // 2× scale for crisp output
    const viewport = page.getViewport({ scale });

    const width = Math.floor(viewport.width);
    const height = Math.floor(viewport.height);

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    // Minimal canvas factory required by pdfjs internal calls
    const canvasFactory = {
      create: (w: number, h: number) => {
        const c = createCanvas(w, h);
        return { canvas: c, context: c.getContext("2d") };
      },
      reset: (obj: any, w: number, h: number) => {
        obj.canvas.width = w;
        obj.canvas.height = h;
      },
      destroy: (obj: any) => {
        obj.canvas.width = 0;
        obj.canvas.height = 0;
      },
    };

    await page.render({
      canvasContext: ctx,
      viewport,
      canvasFactory,
    }).promise;

    results.push(canvas.toBuffer("image/png"));
  }

  return results;
}
