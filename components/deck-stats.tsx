import type { Deck } from '@/lib/deck';
import { averageManaValue, colorSymbols, manaCurve, plural, typeCounts } from '@/lib/deck-stats';

const COLOR_VAR: Record<string, string> = {
  W: 'var(--mana-w)',
  U: 'var(--mana-u)',
  B: 'var(--mana-b)',
  R: 'var(--mana-r)',
  G: 'var(--mana-g)',
};

function Bar({
  label,
  count,
  max,
  fill,
  description,
}: {
  label: string;
  count: number;
  max: number;
  fill?: string;
  description?: string;
}) {
  return (
    <div className="stat-bar" role="img" aria-label={description ?? `${label} ${count}`}>
      <span className="num stat-count">{count}</span>
      <span
        className="stat-fill"
        style={{ height: `${(count / max) * 100}%`, background: fill ?? 'var(--accent)' }}
      />
      <span className="stat-label">{label}</span>
    </div>
  );
}

export function DeckStats({ deck }: { deck: Deck }) {
  const curve = manaCurve(deck);
  const colors = colorSymbols(deck);
  const types = typeCounts(deck);
  const curveMax = Math.max(1, ...curve.map((c) => c.count));
  const colorMax = Math.max(1, ...colors.map((c) => c.count));
  return (
    <section className="deck-stats" aria-labelledby="stats-heading">
      <h2 id="stats-heading">Deck stats</h2>
      <p>
        Average mana value of nonland cards: <span className="num">{averageManaValue(deck)}</span>
      </p>

      <h3>Mana curve</h3>
      <figure className="stat-bars" aria-label="Mana curve">
        {curve.map((b) => (
          <Bar
            key={b.label}
            label={b.label}
            count={b.count}
            max={curveMax}
            description={`Mana value ${b.label}: ${b.count === 0 ? 'no cards' : plural(b.count, 'card')}`}
          />
        ))}
      </figure>

      <h3>Colors</h3>
      <div className="stat-bars" aria-hidden="true">
        {colors.map((c) => (
          <Bar key={c.color} label={c.name} count={c.count} max={colorMax} fill={COLOR_VAR[c.color]} />
        ))}
      </div>
      <ul className="visually-hidden" aria-label="Mana symbols by color">
        {colors.map((c) => (
          <li key={c.color}>{`${c.name} ${c.count}`}</li>
        ))}
      </ul>

      <h3>Card types</h3>
      {types.length === 0 ? (
        <p className="empty">No cards yet.</p>
      ) : (
        <ul className="stat-types" aria-label="Card types">
          {types.map((t) => (
            <li key={t.group}>{`${t.group} ${t.count}`}</li>
          ))}
        </ul>
      )}
    </section>
  );
}
