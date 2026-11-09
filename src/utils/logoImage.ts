/**
 * Client logos are saved with the client's data as a small image (a data URL), so no file-storage
 * service is needed. The picture is shrunk to at most 256 px (sharp at the size it is shown) and
 * saved as WebP when the browser can, which keeps it to a few KB: the client document is sent to
 * every open screen on each change, so it must stay small.
 */

/** Largest saved logo, in characters of the data URL (about 65 KB of image). */
const MAX_CHARS = 90_000;

/** Tried in order until the result is small enough: [longest side in px, WebP quality]. */
const ATTEMPTS: Array<[number, number]> = [[256, 0.85], [256, 0.7], [192, 0.7], [128, 0.6]];

const readAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('logo-unreadable'));
    reader.readAsDataURL(file);
  });

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('logo-unreadable'));
    img.src = src;
  });

/**
 * Turns an image file (PNG, JPG, WebP, SVG, GIF) into a small logo. Throws `logo-unreadable` when
 * the file is not a usable picture and `logo-too-big` when it cannot be made small enough.
 */
export async function makeLogoDataUrl(file: File): Promise<string> {
  const img = await loadImage(await readAsDataUrl(file));
  // An SVG without a set size can report 0: draw it as a square.
  const width = img.naturalWidth || img.width || 256;
  const height = img.naturalHeight || img.height || 256;

  for (const [side, quality] of ATTEMPTS) {
    const scale = Math.min(1, side / Math.max(width, height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(width * scale));
    canvas.height = Math.max(1, Math.round(height * scale));
    // A canvas kept in memory (not on the graphics card): reading it back for the file is then quick
    // even while the page is busy drawing (it took seconds on a heavy client page otherwise).
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error('logo-unreadable');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    // Browsers that cannot write WebP return PNG instead (transparency is kept either way).
    const url = canvas.toDataURL('image/webp', quality);
    if (url.length <= MAX_CHARS) return url;
  }
  throw new Error('logo-too-big');
}
