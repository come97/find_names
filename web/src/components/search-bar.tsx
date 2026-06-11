"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  loadNamesIndex,
  searchIndex,
  type IndexEntry,
} from "@/lib/names-index";
import { displayName } from "@/lib/types";

const GENDER_LABEL: Record<number, string> = {
  1: "garçon",
  2: "fille",
  3: "mixte",
};

export function SearchBar({
  onSelect,
  onSurprise,
  selected,
}: {
  onSelect: (name: string) => void;
  onSurprise: () => void;
  selected: string[];
}) {
  const [query, setQuery] = useState("");
  const [highlightedRaw, setHighlighted] = useState(0);
  const [index, setIndex] = useState<IndexEntry[] | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // L'index (~150 Ko gzippé) est chargé au montage : la recherche est
  // ensuite 100 % locale, aucun aller-retour réseau par frappe.
  useEffect(() => {
    loadNamesIndex().then(setIndex);
  }, []);

  const results = useMemo(
    () => (index ? searchIndex(index, query) : []),
    [index, query]
  );
  const highlighted = Math.min(highlightedRaw, Math.max(results.length - 1, 0));

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (!wrapperRef.current?.contains(e.target as Node)) setQuery("");
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const pick = (name: string) => {
    onSelect(name);
    setQuery("");
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted((h) => (h + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((h) => (h - 1 + results.length) % results.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      pick(results[highlighted][0]);
    } else if (e.key === "Escape") {
      setQuery("");
    }
  };

  return (
    <div ref={wrapperRef} className="relative">
      <div className="flex items-center gap-2 rounded-full border-2 border-ink bg-paper px-5 py-3 shadow-[4px_4px_0_0_var(--color-ink)] transition-shadow focus-within:shadow-[2px_2px_0_0_var(--color-vermillon)]">
        <svg
          className="h-5 w-5 shrink-0 text-ink-soft"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setHighlighted(0);
          }}
          onKeyDown={onKeyDown}
          placeholder="Camille, Côme, Brigitte…"
          aria-label="Rechercher un prénom"
          className="w-full bg-transparent text-base outline-none placeholder:text-ink-faint"
        />
        <button
          type="button"
          onClick={onSurprise}
          title="Un prénom au hasard"
          className="shrink-0 rounded-full bg-vermillon px-3 py-1 text-xs font-semibold uppercase tracking-wider text-paper transition-colors hover:bg-vermillon-deep"
        >
          Hasard
        </button>
      </div>

      {results.length > 0 && (
        <ul className="absolute top-full left-0 right-0 z-50 mt-2 max-h-72 overflow-auto rounded-2xl border-2 border-ink bg-paper py-1 text-left shadow-[4px_4px_0_0_var(--color-ink)]">
          {results.map(([name, total, gender], i) => (
            <li key={name}>
              <button
                type="button"
                onMouseEnter={() => setHighlighted(i)}
                onClick={() => pick(name)}
                className={`flex w-full items-baseline gap-2 px-5 py-2 text-sm ${
                  i === highlighted ? "bg-paper-deep" : ""
                }`}
              >
                <span className="font-semibold">{displayName(name)}</span>
                <span className="text-xs text-ink-faint">
                  {GENDER_LABEL[gender]}
                </span>
                <span className="ml-auto text-xs tabular-nums text-ink-soft">
                  {total.toLocaleString("fr-FR")} naissances
                </span>
                {selected.includes(name) && (
                  <span className="text-xs font-semibold text-sage">✓</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
