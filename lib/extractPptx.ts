import JSZip from "jszip";

/**
 * Extracts one image per slide from a PPTX in correct slide order.
 *
 * How it works:
 * 1. Reads ppt/slides/slide1.xml, slide2.xml ... in numeric order
 * 2. For each slide, reads its _rels file to find which media files it references
 * 3. Returns the first image found for each slide — in slide order
 *
 * This is correct because ppt/media/ files are stored in insertion order,
 * NOT slide order. The only reliable source of slide→image mapping is the
 * per-slide relationship file.
 */
export async function extractPptxImages(
  buffer: Buffer | ArrayBuffer
): Promise<{ name: string; data: Buffer; mimeType: string }[]> {
  const zip = await JSZip.loadAsync(buffer as ArrayBuffer);

  // 1. Get all slide XML files, sorted numerically
  const slideEntries = Object.keys(zip.files)
    .filter((f) => /^ppt\/slides\/slide\d+\.xml$/.test(f))
    .sort((a, b) => {
      const na = parseInt(a.match(/(\d+)/)?.[1] ?? "0", 10);
      const nb = parseInt(b.match(/(\d+)/)?.[1] ?? "0", 10);
      return na - nb;
    });

  const results: { name: string; data: Buffer; mimeType: string }[] = [];

  for (const slidePath of slideEntries) {
    const slideNum = slidePath.match(/slide(\d+)\.xml/)?.[1] ?? "?";

    // 2. Read the relationship file for this slide
    const relsPath = slidePath.replace(
      "ppt/slides/slide",
      "ppt/slides/_rels/slide"
    ).replace(".xml", ".xml.rels");

    if (!zip.files[relsPath]) {
      // No rels file — push a placeholder so slide numbering stays aligned
      results.push({ name: `slide${slideNum}_no_image`, data: Buffer.alloc(0), mimeType: "image/png" });
      continue;
    }

    const relsXml = await zip.files[relsPath].async("string");

    // 3. Extract all image targets referenced by this slide
    const imageTargets: string[] = [];
    const relMatches = relsXml.matchAll(
      /Type="[^"]*\/image"[^/]*Target="([^"]+)"/g
    );
    for (const m of relMatches) {
      let target = m[1];
      // Targets are relative to ppt/slides/ → resolve to full path
      if (target.startsWith("../")) {
        target = "ppt/" + target.slice(3);
      } else if (!target.startsWith("ppt/")) {
        target = "ppt/slides/" + target;
      }
      if (/\.(png|jpg|jpeg|gif|webp)$/i.test(target)) {
        imageTargets.push(target);
      }
    }

    // 4. Pick the first valid image for this slide
    let found = false;
    for (const imgPath of imageTargets) {
      const file = zip.files[imgPath];
      if (!file) continue;

      const data = Buffer.from(await file.async("arraybuffer"));
      if (data.length === 0) continue;

      const ext = imgPath.split(".").pop()?.toLowerCase() ?? "png";
      const mimeType =
        ext === "jpg" || ext === "jpeg" ? "image/jpeg"
        : ext === "gif" ? "image/gif"
        : ext === "webp" ? "image/webp"
        : "image/png";

      results.push({
        name: `slide${slideNum}.${ext}`,
        data,
        mimeType,
      });
      found = true;
      break;
    }

    if (!found) {
      // Slide exists but has no embedded image — keep slot so numbering stays aligned
      results.push({ name: `slide${slideNum}_no_image`, data: Buffer.alloc(0), mimeType: "image/png" });
    }
  }

  // Filter out empty placeholders before returning
  return results.filter((r) => r.data.length > 0);
}
