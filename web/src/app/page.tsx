import { createLoader } from "nuqs/server";
import { namesParser } from "@/lib/search-params";
import { loadSeries, loadSuggestions } from "@/lib/data";
import { Explorer } from "@/components/explorer";

const loadParams = createLoader({ names: namesParser });

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { names } = await loadParams(await searchParams);
  const [initialSeries, suggestions] = await Promise.all([
    loadSeries(names),
    loadSuggestions(),
  ]);

  return <Explorer initialSeries={initialSeries} suggestions={suggestions} />;
}
