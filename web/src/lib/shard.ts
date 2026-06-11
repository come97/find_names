/**
 * Clé de shard pour un prénom : bigramme initial normalisé (sans diacritiques),
 * restreint à A-Z, complété par "_" si besoin. Partagé entre le script de
 * génération des données et le chargement runtime.
 */
export function shardKey(name: string): string {
  const normalized = name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/[^A-Z]/g, "");
  return (normalized + "__").slice(0, 2);
}

/** Normalise pour la recherche : majuscules sans diacritiques. */
export function normalizeForSearch(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase();
}
