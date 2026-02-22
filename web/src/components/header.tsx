import { Baby } from "lucide-react";
import Link from "next/link";
import { SearchBar } from "./search-bar";

export function Header() {
  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <Baby className="h-6 w-6 text-primary" />
          <span className="text-lg font-semibold hidden sm:inline">
            Prénoms de France
          </span>
        </Link>
        <div className="flex-1 max-w-md">
          <SearchBar />
        </div>
      </div>
    </header>
  );
}
