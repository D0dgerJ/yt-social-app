export function insertAtCursor(ref: React.RefObject<HTMLTextAreaElement>, value: string) {
  const ta = ref.current;
  if (!ta) return;
  const start = ta.selectionStart ?? 0;
  const end = ta.selectionEnd ?? 0;
  const text = ta.value;
  const next = text.slice(0, start) + value + text.slice(end);
  ta.value = next;
  const pos = start + value.length;
  ta.setSelectionRange(pos, pos);
  ta.focus();
  const evt = new Event('input', { bubbles: true });
  ta.dispatchEvent(evt);
}