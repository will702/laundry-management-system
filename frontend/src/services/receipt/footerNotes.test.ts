import { describe, it, expect } from 'vitest';
import { parseFooterNotes, renderFooterNotesText, renderFooterNotesHtml } from './footerNotes';

describe('parseFooterNotes', () => {
  it('returns empty array for null/undefined/empty', () => {
    expect(parseFooterNotes(null)).toEqual([]);
    expect(parseFooterNotes(undefined)).toEqual([]);
    expect(parseFooterNotes('')).toEqual([]);
  });

  it('parses newline-separated (canonical format)', () => {
    const raw = 'Terima kasih\nJam operasional: 07:00-21:00\nKomplain maks 1x24 jam';
    expect(parseFooterNotes(raw)).toEqual([
      'Terima kasih',
      'Jam operasional: 07:00-21:00',
      'Komplain maks 1x24 jam',
    ]);
  });

  it('parses bullet-separated (legacy format fallback)', () => {
    const raw = 'Terima kasih•Jam operasional: 07:00-21:00•Komplain maks 1x24 jam';
    expect(parseFooterNotes(raw)).toEqual([
      'Terima kasih',
      'Jam operasional: 07:00-21:00',
      'Komplain maks 1x24 jam',
    ]);
  });

  it('trims whitespace and drops empty entries', () => {
    expect(parseFooterNotes('  note 1  \n\n  note 2  ')).toEqual(['note 1', 'note 2']);
  });

  it('prefers newline over bullet when both present', () => {
    const raw = 'line 1\nline 2•not a separator';
    const result = parseFooterNotes(raw);
    expect(result).toContain('line 1');
    expect(result).toContain('line 2•not a separator');
  });
});

describe('renderFooterNotesText', () => {
  it('adds bullet prefix and joins with newlines', () => {
    const notes = ['note A', 'note B'];
    expect(renderFooterNotesText(notes)).toBe('• note A\n• note B');
  });

  it('returns empty string for empty array', () => {
    expect(renderFooterNotesText([])).toBe('');
  });
});

describe('renderFooterNotesHtml', () => {
  it('wraps each note in <p> with bullet', () => {
    const notes = ['note A', 'note B'];
    expect(renderFooterNotesHtml(notes)).toBe('<p>• note A</p><p>• note B</p>');
  });
});
