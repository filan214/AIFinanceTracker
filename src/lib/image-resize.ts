// Downscale a photo in the browser so it fits well under Vercel's 4.5 MB body
// limit, and re-encode as JPEG (also normalizes PNG/WebP).
export async function resizeImageToDataUrl(
  file: File,
  maxDim = 1600,
  quality = 0.8
): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas_unavailable");
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", quality);
}
