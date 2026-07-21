/**
 * Türkçe uyumlu arama metni normalizasyonu.
 */

export function normalizeSearchText(value) {
  return String(value || "")
    .trim()
    .toLocaleLowerCase("tr")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/**
 * MUI Autocomplete filterOptions — büyük/küçük harf ve Türkçe duyarsız.
 * options listesi üstte useMemo ile sabitlenmeli; bu fonksiyon sadece eşleştirir.
 */
export function createSearchFilter(getOptionLabel = (o) => String(o ?? "")) {
  return (options, state) => {
    const query = normalizeSearchText(state.inputValue);
    if (!query) return options;

    return options.filter((option) =>
      normalizeSearchText(getOptionLabel(option)).includes(query)
    );
  };
}
