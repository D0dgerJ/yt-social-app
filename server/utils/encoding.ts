export function fixLatin1ToUtf8(input: string): string {
  if (!input) return "";

  try {
    const buf = Buffer.from(input, "latin1");
    const decoded = buf.toString("utf8");

    const nonAsciiOriginal = (input.match(/[^\x00-\x7F]/g) || []).length;
    const nonAsciiDecoded = (decoded.match(/[^\x00-\x7F]/g) || []).length;

    if (nonAsciiDecoded > nonAsciiOriginal) {
      return decoded;
    }

    return input;
  } catch {
    return input;
  }
}

export function encodeRFC5987(str: string): string {
  return encodeURIComponent(str)
    .replace(/'/g, "%27")
    .replace(/\*/g, "%2A")
    .replace(/%20/g, "%20");
}

export function asciiFallback(str: string): string {
  return str.replace(/[^\x20-\x7E]/g, "_");
}