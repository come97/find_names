import { parseAsArrayOf, parseAsString } from "nuqs/server";

export const namesParser = parseAsArrayOf(parseAsString, ",").withDefault([]);
