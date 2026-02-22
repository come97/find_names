"use client";

import { useQueryState } from "nuqs";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { namesParser } from "@/lib/search-params";
import { NameChart } from "./name-chart";

export function NameSelection() {
  const [names, setNames] = useQueryState("names", namesParser);

  const removeName = (name: string) => {
    setNames(names.filter((n) => n !== name));
  };

  if (names.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Utilisez la barre de recherche pour ajouter des prénoms à comparer.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {names.map((name) => (
          <span
            key={name}
            className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-sm font-medium"
          >
            {name}
            <button
              type="button"
              onClick={() => removeName(name)}
              className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setNames([])}
          className="text-xs text-muted-foreground"
        >
          Tout effacer
        </Button>
      </div>
      <NameChart names={names} />
    </div>
  );
}
