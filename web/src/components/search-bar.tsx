"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useQueryState } from "nuqs";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { searchNames } from "@/app/actions/search";
import { namesParser } from "@/lib/search-params";

interface SearchResult {
  name: string;
  gender: number;
}

export function SearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [names, setNames] = useQueryState("names", namesParser);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  const handleSearch = useCallback((value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      const data = await searchNames(value);
      setResults(data);
      setIsOpen(data.length > 0);
    }, 200);
  }, []);

  const addName = useCallback(
    (name: string) => {
      if (!names.includes(name)) {
        setNames([...names, name]);
      }
      setQuery("");
      setResults([]);
      setIsOpen(false);
    },
    [names, setNames]
  );

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Rechercher un prénom..."
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          className="pl-9"
        />
      </div>
      {isOpen && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-md border bg-popover shadow-md">
          <ul className="max-h-60 overflow-auto py-1">
            {results.map((r) => (
              <li key={`${r.name}-${r.gender}`}>
                <button
                  type="button"
                  onClick={() => addName(r.name)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent"
                >
                  <span className="font-medium">{r.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {r.gender === 1 ? "Garcon" : "Fille"}
                  </span>
                  {names.includes(r.name) && (
                    <span className="ml-auto text-xs text-primary">
                      ajouté
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
