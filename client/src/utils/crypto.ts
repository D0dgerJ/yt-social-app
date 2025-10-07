export function decryptText(cipher?: string): string {
  if (!cipher) return '';
  if (cipher.startsWith('b64:')) {
    try {
      const raw = cipher.slice(4);
      return decodeURIComponent(escape(atob(raw)));
    } catch {
      return '[decrypt-error]';
    }
  }
  return cipher;
}
