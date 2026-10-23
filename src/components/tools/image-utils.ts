export const MAX_INPUT_BYTES = 25 * 1024 * 1024;
export const ACCEPTED_TYPES = "image/jpeg,image/png,image/webp,image/heic,image/heif";

export type LoadedImage = { element: HTMLImageElement; url: string; width: number; height: number; file: File };

/** Decodes a user-selected file. The caller owns `url` and must revoke it. */
export async function loadImage(file: File): Promise<LoadedImage> {
  if (!file.type.startsWith("image/")) throw new Error("That file isn't an image. Choose a JPEG, PNG, or WebP photo.");
  if (file.size > MAX_INPUT_BYTES) throw new Error("That image is over 25 MB. Choose a smaller photo.");

  const url = URL.createObjectURL(file);
  const element = new Image();
  element.decoding = "async";
  element.src = url;
  try {
    await element.decode();
  } catch {
    URL.revokeObjectURL(url);
    throw new Error("This browser can't open that image. Try a JPEG or PNG (HEIC photos may need converting first).");
  }
  return { element, url, width: element.naturalWidth, height: element.naturalHeight, file };
}

export function createCanvas(width: number, height: number) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Your browser doesn't support image editing (canvas unavailable).");
  context.imageSmoothingQuality = "high";
  return { canvas, context };
}

/**
 * Fills the canvas with white paper color before drawing, so transparent
 * areas don't turn black in JPEG output. This is photo data, not UI styling.
 */
export function fillPhotoBackground(context: CanvasRenderingContext2D) {
  context.fillStyle = "#ffffff"; // design-tokens-ignore-line
  context.fillRect(0, 0, context.canvas.width, context.canvas.height);
}

export function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Couldn't encode the image."))), type, quality);
  });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(bytes < 10 * 1024 ? 1 : 0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function baseName(file: File) {
  return file.name.replace(/\.[^.]+$/, "").replace(/[^\w-]+/g, "-").slice(0, 60) || "photo";
}
