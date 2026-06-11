"use client";

import { useEffect, useMemo, useState } from "react";
import { useQueryState } from "nuqs";
import { namesParser } from "@/lib/search-params";
import {
  displayName,
  summarize,
  type NameSeries,
} from "@/lib/types";
import { fetchSeries, primeSeriesCache } from "@/lib/series-client";
import { loadNamesIndex, randomName } from "@/lib/names-index";
import { SearchBar } from "./search-bar";
import { NameChart, PALETTE } from "./name-chart";

const MAX_NAMES = 6;

export function Explorer({
  initialSeries,
  suggestions,
}: {
  initialSeries: NameSeries;
  suggestions: { recent: string[]; classics: string[] };
}) {
  const [names, setNames] = useQueryState("names", namesParser);
  const [series, setSeries] = useState<NameSeries>(() => {
    primeSeriesCache(initialSeries);
    return initialSeries;
  });

  useEffect(() => {
    let cancelled = false;
    fetchSeries(names).then((s) => {
      if (!cancelled) setSeries(s);
    });
    return () => {
      cancelled = true;
    };
  }, [names]);

  const addName = (name: string) => {
    const upper = name.toUpperCase();
    if (!names.includes(upper) && names.length < MAX_NAMES) {
      setNames([...names, upper]);
    }
  };

  const surprise = async () => {
    const index = await loadNamesIndex();
    let pick = randomName(index);
    while (names.includes(pick)) pick = randomName(index);
    addName(pick);
  };

  const active = useMemo(
    () => names.filter((n) => series[n]),
    [names, series]
  );

  return (
    <div className="mx-auto max-w-5xl px-4 pb-20">
      {/* En-tête éditorial */}
      <header className="rise flex items-baseline justify-between border-b border-line pb-3 pt-6">
        <span className="font-display text-xl font-semibold tracking-tight">
          Prénoms<span className="text-accent">.</span>
        </span>
        <span className="text-xs uppercase tracking-[0.2em] text-ink-soft">
          INSEE · 1900–2022
        </span>
      </header>

      {/* Héro + recherche */}
      <section className="rise rise-1 relative z-20 pt-12 pb-8 text-center">
        <h1 className="font-display text-4xl font-medium leading-tight tracking-tight sm:text-6xl">
          Un siècle de prénoms
          <br />
          <em className="text-accent">français</em>
        </h1>
        <p className="mx-auto mt-4 max-w-md text-sm text-ink-soft sm:text-base">
          Cherchez un prénom, comparez son destin à d&apos;autres, partagez la
          courbe d&apos;un simple lien.
        </p>
        <div className="mx-auto mt-8 max-w-lg">
          <SearchBar
            onSelect={addName}
            onSurprise={surprise}
            selected={names}
          />
        </div>
      </section>

      {/* Sélection */}
      {names.length > 0 && (
        <section className="rise rise-2 space-y-6">
          <div className="flex flex-wrap items-center justify-center gap-2">
            {names.map((name, i) => (
              <button
                key={name}
                type="button"
                onClick={() => setNames(names.filter((n) => n !== name))}
                title="Retirer"
                className="group inline-flex items-center gap-2 rounded-full border-2 bg-paper px-4 py-1.5 text-sm font-semibold transition-transform hover:-translate-y-0.5"
                style={{
                  borderColor: PALETTE[i % PALETTE.length],
                  color: PALETTE[i % PALETTE.length],
                }}
              >
                {displayName(name)}
                <span className="text-xs opacity-40 transition-opacity group-hover:opacity-100">
                  ✕
                </span>
              </button>
            ))}
            {names.length > 1 && (
              <button
                type="button"
                onClick={() => setNames([])}
                className="px-2 text-xs uppercase tracking-wider text-ink-faint hover:text-accent"
              >
                Tout effacer
              </button>
            )}
          </div>

          {active.length > 0 && (
            <>
              <NameChart names={active} series={series} />
              <StatCards names={active} series={series} />
            </>
          )}
        </section>
      )}

      {/* État vide : suggestions */}
      {names.length === 0 && (
        <section className="rise rise-3 mx-auto max-w-2xl space-y-8 pt-6">
          <SuggestionRow
            label="Tendances 2022"
            names={suggestions.recent}
            onPick={addName}
          />
          <SuggestionRow
            label="Classiques du siècle"
            names={suggestions.classics}
            onPick={addName}
          />
        </section>
      )}

      <footer className="mt-20 border-t border-line pt-4 text-center text-xs text-ink-faint">
        Données : fichier des prénoms INSEE (nat2022) · Les prénoms donnés
        moins de 3 fois par an ne sont pas comptés
      </footer>
    </div>
  );
}

function SuggestionRow({
  label,
  names,
  onPick,
}: {
  label: string;
  names: string[];
  onPick: (name: string) => void;
}) {
  return (
    <div>
      <h2 className="mb-3 text-center text-xs font-semibold uppercase tracking-[0.25em] text-ink-soft">
        {label}
      </h2>
      <div className="flex flex-wrap justify-center gap-2">
        {names.map((name) => (
          <button
            key={name}
            type="button"
            onClick={() => onPick(name)}
            className="rounded-full border border-line bg-paper-deep px-4 py-1.5 text-sm font-medium text-ink transition-all hover:-translate-y-0.5 hover:border-accent hover:text-accent"
          >
            {displayName(name)}
          </button>
        ))}
      </div>
    </div>
  );
}

function StatCards({
  names,
  series,
}: {
  names: string[];
  series: NameSeries;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {names.map((name, i) => {
        const s = summarize(series[name]);
        const color = PALETTE[i % PALETTE.length];
        const girlsPct = Math.round((1 - s.boysShare) * 100);
        return (
          <article
            key={name}
            className="rounded-xl border border-line bg-paper-deep/60 p-5"
          >
            <h3
              className="font-display text-2xl font-semibold"
              style={{ color }}
            >
              {displayName(name)}
            </h3>
            <dl className="mt-3 space-y-1.5 text-sm">
              <Stat label="Naissances depuis 1900" value={fmt(s.total)} />
              <Stat
                label="Année record"
                value={`${s.peakYear} (${fmt(s.peakCount)})`}
              />
              <Stat label="En 2022" value={s.latestCount ? fmt(s.latestCount) : "—"} />
            </dl>
            {/* répartition filles / garçons */}
            <div className="mt-4">
              <div className="flex h-1.5 overflow-hidden rounded-full bg-line">
                <div
                  className="bg-azur"
                  style={{ width: `${100 - girlsPct}%` }}
                />
                <div className="bg-blush" style={{ width: `${girlsPct}%` }} />
              </div>
              <div className="mt-1 flex justify-between text-[11px] text-ink-faint">
                <span>{100 - girlsPct}% garçons</span>
                <span>{girlsPct}% filles</span>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <dt className="text-ink-soft">{label}</dt>
      <dd className="font-semibold tabular-nums">{value}</dd>
    </div>
  );
}

function fmt(n: number): string {
  return n.toLocaleString("fr-FR");
}
