import { parseAsArrayOf, parseAsString } from "nuqs";

export const namesParser = parseAsArrayOf(parseAsString, ",").withDefault([]);
