/** Parse raw footer notes from DB or legacy storage.
 *  Canonical: newline-separated. Legacy fallback: bullet-separated. */
export function parseFooterNotes(raw: string | null | undefined): string[] {
  if (!raw) return [];
  // Prefer newline split; fall back to bullet split for legacy data
  const separator = raw.includes('\n') ? '\n' : '•';
  return raw
    .split(separator)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Render for ESC/POS plain text — one bullet per line */
export function renderFooterNotesText(notes: string[]): string {
  return notes.map((n) => `• ${n}`).join('\n');
}

/** Render for HTML receipts (window.print / settings preview) */
export function renderFooterNotesHtml(notes: string[]): string {
  return notes.map((n) => `<p>• ${n}</p>`).join('');
}
