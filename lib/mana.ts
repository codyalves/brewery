/**
 * Mana costs as symbols, for drawing them as pips: "{2}{U}{U}" becomes
 * [generic 2, blue, blue]. Hybrid and Phyrexian symbols ({W/U}, {G/P})
 * keep both colors so a pip can show them.
 */
export type ManaSymbol =
  | { readonly kind: 'generic'; readonly text: string }
  | {
      readonly kind: 'color';
      readonly colors: readonly string[];
      readonly phyrexian: boolean;
      readonly text: string;
    }
  | { readonly kind: 'colorless'; readonly text: string }
  | { readonly kind: 'other'; readonly text: string };

const COLOR_LETTERS = new Set(['W', 'U', 'B', 'R', 'G']);

export function parseManaCost(cost: string): ManaSymbol[] {
  return [...cost.matchAll(/\{([^}]+)\}/g)].map((m) => {
    const text = (m[1] ?? '').toUpperCase();
    if (/^\d+$|^X$|^Y$|^Z$/.test(text)) return { kind: 'generic', text };
    if (text === 'C') return { kind: 'colorless', text };
    const parts = text.split('/');
    const colors = parts.filter((p) => COLOR_LETTERS.has(p));
    if (colors.length > 0) return { kind: 'color', colors, phyrexian: parts.includes('P'), text };
    return { kind: 'other', text };
  });
}

const NAMES: Record<string, string> = { W: 'white', U: 'blue', B: 'black', R: 'red', G: 'green' };

/** What a screen reader says for a cost: "2 generic, blue, blue". */
export function describeManaCost(cost: string): string {
  return parseManaCost(cost)
    .map((s) => {
      if (s.kind === 'generic') return `${s.text} generic`;
      if (s.kind === 'colorless') return 'colorless';
      if (s.kind === 'color') {
        const names = s.colors.map((c) => NAMES[c] ?? c).join(' or ');
        return s.phyrexian ? `Phyrexian ${names}` : names;
      }
      return s.text;
    })
    .join(', ');
}
