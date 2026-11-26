import type { Deck } from '@/lib/deck';
import { cardProblems, sizeCheck } from '@/lib/deck-rules';

export function DeckRules({ deck }: { deck: Deck }) {
  const problems = cardProblems(deck);
  const size = sizeCheck(deck);
  return (
    <section aria-labelledby="rules-heading">
      <h2 id="rules-heading">Rules check</h2>
      <p data-testid="size-check">{size.message}</p>
      {problems.length === 0 && size.ok ? (
        <p>No rule problems found</p>
      ) : (
        <ul aria-label="Rule problems">
          {problems.map((p) => (
            <li key={`${p.oracleId}-${p.reason}`}>{`${p.name}: ${p.reason}`}</li>
          ))}
        </ul>
      )}
    </section>
  );
}
