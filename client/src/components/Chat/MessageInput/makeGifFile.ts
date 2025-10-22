export async function makeGifFile(url: string): Promise<File> {
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`GIF fetch failed: ${resp.status}`);
  const blob = await resp.blob();

  const mime = (blob.type || 'image/gif').toLowerCase();
  const ext =
    mime.includes('webp') ? 'webp' :
    mime.includes('mp4')  ? 'mp4'  :
    'gif';

  return new File([blob], `gif-${Date.now()}.${ext}`, { type: mime });
}