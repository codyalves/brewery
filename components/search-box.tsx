'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

const DELAY_MS = 200;
const href = (q: string) => `/cards?${new URLSearchParams({ q }).toString()}`;

/** The search input: results update as you type and card names are suggested. */
export function SearchBox({ query, hint }: { query: string; hint?: boolean }) {
  const router = useRouter();
  const [value, setValue] = useState(query);
  const [names, setNames] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const last = useRef(query);
  const seq = useRef(0);

  useEffect(() => {
    const text = value.trim();
    const id = ++seq.current;
    const timer = setTimeout(async () => {
      if (text && text !== last.current) {
        last.current = text;
        router.replace(href(text));
      }
      if (text.length < 2) {
        setNames([]);
        setOpen(false);
        return;
      }
      try {
        const res = await fetch(`/api/cards/autocomplete?q=${encodeURIComponent(text)}`);
        const data: unknown = res.ok ? await res.json() : [];
        if (id !== seq.current) return;
        const list = Array.isArray(data) ? data.filter((n): n is string => typeof n === 'string') : [];
        setNames(list);
        setActive(-1);
        setOpen(list.length > 0);
      } catch {
        if (id === seq.current) setNames([]);
      }
    }, DELAY_MS);
    return () => clearTimeout(timer);
  }, [value, router]);

  function choose(name: string) {
    seq.current++;
    last.current = name;
    setValue(name);
    setOpen(false);
    setActive(-1);
    router.push(href(name));
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown' && names.length > 0) {
      e.preventDefault();
      setOpen(true);
      setActive((a) => (a + 1) % names.length);
    } else if (e.key === 'ArrowUp' && names.length > 0) {
      e.preventDefault();
      setOpen(true);
      setActive((a) => (a <= 0 ? names.length - 1 : a - 1));
    } else if (e.key === 'Escape') {
      setOpen(false);
      setActive(-1);
    } else if (e.key === 'Enter' && open && active >= 0 && names[active]) {
      e.preventDefault();
      choose(names[active]);
    }
  }

  const expanded = open && names.length > 0;
  return (
    <search className="search">
      <form action="/cards">
        <label htmlFor="q" className="visually-hidden">
          Search cards
        </label>
        <div className="combobox">
          <input
            id="q"
            name="q"
            type="search"
            role="combobox"
            autoComplete="off"
            aria-autocomplete="list"
            aria-expanded={expanded}
            aria-controls={expanded ? 'search-suggestions' : undefined}
            aria-activedescendant={expanded && active >= 0 ? `suggestion-${active}` : undefined}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={onKeyDown}
            onBlur={() => setOpen(false)}
            placeholder="Search cards, e.g. t:dragon c:r"
          />
          {expanded ? (
            <ul id="search-suggestions" role="listbox" aria-label="Card name suggestions" className="suggestions">
              {names.map((name, i) => (
                <li
                  key={name}
                  id={`suggestion-${i}`}
                  role="option"
                  aria-selected={i === active}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    choose(name);
                  }}
                >
                  {name}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        <button type="submit" className="button">
          Search
        </button>
      </form>
      {hint ? (
        <p className="muted" id="search-hint">
          Try <span className="mono">t:creature</span>, <span className="mono">c:r</span>,{' '}
          <span className="mono">o:draw</span> or <span className="mono">cmc&lt;=3</span>
        </p>
      ) : null}
    </search>
  );
}
