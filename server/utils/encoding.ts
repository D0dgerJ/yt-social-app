export function fixLatin1ToUtf8(s: string) {
  try {
    const buf = Buffer.from(s, 'binary');
    const recon = Buffer.from(buf.toString('utf8'), 'utf8').toString();
    const badSeq = /Ã.|Â.|Ð.|Ñ.|Ð|Ñ/g;
    return badSeq.test(recon) ? recon : s;
  } catch {
    return s;
  }
}

export function encodeRFC5987(str: string) {
  return encodeURIComponent(str)
    .replace(/'/g, "%27")
    .replace(/\*/g, "%2A")
    .replace(/%20/g, "%20");
}

export function asciiFallback(str: string) {
  return str.replace(/[^\x20-\x7E]/g, "_");
}