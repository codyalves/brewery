import { describeManaCost, type ManaSymbol, parseManaCost } from '@/lib/mana';

function tone(s: ManaSymbol): string {
  if (s.kind === 'color') return `pip-${(s.colors[0] ?? 'c').toLowerCase()}`;
  if (s.kind === 'generic') return 'pip-generic';
  return s.kind === 'colorless' ? 'pip-c' : 'pip-other';
}

/** A mana cost as round pips, read aloud as words. */
export function ManaCost({ cost }: { cost: string }) {
  const seen = new Map<string, number>();
  // Symbols repeat ({U}{U}): number each repeat so keys stay unique and stable.
  const symbols = parseManaCost(cost).map((s) => {
    const n = (seen.get(s.text) ?? 0) + 1;
    seen.set(s.text, n);
    return { symbol: s, key: `${s.text}:${n}` };
  });
  if (symbols.length === 0) return null;
  return (
    <span className="pips" role="img" aria-label={describeManaCost(cost)}>
      {symbols.map(({ symbol, key }) => (
        <span key={key} className={`pip ${tone(symbol)}`} aria-hidden="true">
          {symbol.kind === 'color' ? symbol.colors.join('/') + (symbol.phyrexian ? 'ᵖ' : '') : symbol.text}
        </span>
      ))}
    </span>
  );
}
