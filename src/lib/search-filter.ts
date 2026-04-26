export function filterGlobalSearchResult(
  value: string,
  search: string,
  keywords?: string[],
) {
  const queryTokens = tokenizeSearchText(search);

  if (!queryTokens.length) {
    return 1;
  }

  const searchableText = normalizeSearchText(
    keywords?.length ? keywords.join(" ") : value,
  );

  if (!searchableText) {
    return 0;
  }

  const searchableWords = searchableText.split(" ");
  const matchesAllTokens = queryTokens.every((token) => searchableText.includes(token));

  if (!matchesAllTokens) {
    return 0;
  }

  const hasWordPrefixMatch = queryTokens.every((token) =>
    searchableWords.some((word) => word.startsWith(token)),
  );

  return hasWordPrefixMatch ? 1 : 0.65;
}

function tokenizeSearchText(value: string) {
  return normalizeSearchText(value).split(" ").filter(Boolean);
}

function normalizeSearchText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}
