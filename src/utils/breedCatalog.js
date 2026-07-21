/**
 * Tür / ırk kataloğu — AnimalForm autocomplete için.
 */

export const SPECIES_OPTIONS = [
  "Kedi",
  "Köpek",
  "Kuş",
  "Tavşan",
  "Kemirgen",
  "At",
  "Büyükbaş",
  "Küçükbaş",
  "Sürüngen",
  "Diğer",
];

export const BREEDS_BY_SPECIES = {
  Köpek: [
    "Labrador Retriever",
    "Golden Retriever",
    "Rottweiler",
    "Doberman",
    "Husky",
    "Kangal",
    "Pug",
    "Beagle",
    "Cane Corso",
    "Alman Kurdu",
    "Chihuahua",
    "Poodle",
    "Bulldog",
    "Boxer",
    "Cocker Spaniel",
    "Jack Russell Terrier",
    "Maltese",
    "Shih Tzu",
    "Yorkshire Terrier",
    "Border Collie",
    "Akita",
    "Dalmatian",
    "French Bulldog",
    "Pitbull",
    "Pointer",
    "Setter",
    "Terrier",
    "Melez",
    "Diğer",
  ],
  Kedi: [
    "British Shorthair",
    "Scottish Fold",
    "Persian",
    "Van Kedisi",
    "Maine Coon",
    "Sphynx",
    "Bengal",
    "Siamese",
    "Tekir",
    "Ankara Kedisi",
    "Ragdoll",
    "Russian Blue",
    "Abyssinian",
    "Birman",
    "Exotic Shorthair",
    "Norwegian Forest",
    "Melez",
    "Diğer",
  ],
  Kuş: ["Muhabbet Kuşu", "Sultan Papağanı", "Kanarya", "Papağan", "Diğer"],
  Tavşan: ["Hollanda Lop", "Angora", "Rex", "Diğer"],
  Kemirgen: ["Hamster", "Kobay", "Çinçilla", "Diğer"],
  At: ["Arap", "İngiliz", "Haflinger", "Diğer"],
  Büyükbaş: ["Holstein", "Simental", "Jersey", "Diğer"],
  Küçükbaş: ["Merinos", "Kıvırcık", "Saanen", "Diğer"],
  Sürüngen: ["Iguana", "Kaplumbağa", "Yılan", "Diğer"],
  Diğer: ["Diğer"],
};

export function getBreedsForSpecies(species) {
  if (!species) return [];
  return [...(BREEDS_BY_SPECIES[species] || ["Diğer"])];
}

/**
 * Sık kullanılan ırklar — mevcut hayvan kayıtlarından sayılır.
 */
export function countBreedFrequency(animals = [], species = "") {
  const map = new Map();

  animals.forEach((animal) => {
    if (species && animal.species !== species) return;
    const breed = String(animal.breed || "").trim();
    if (!breed) return;
    map.set(breed, (map.get(breed) || 0) + 1);
  });

  return map;
}

/**
 * Irk seçeneklerini sıralar:
 * 1) Son kullanılanlar
 * 2) Sık kullanılanlar
 * 3) Katalog + kayıtlı özel ırklar (alfabetik)
 */
export function buildBreedOptions({
  species,
  animals = [],
  recentBreeds = [],
  limitRecent = 10,
} = {}) {
  const catalog = getBreedsForSpecies(species);
  const freq = countBreedFrequency(animals, species);

  animals.forEach((animal) => {
    if (species && animal.species !== species) return;
    const breed = String(animal.breed || "").trim();
    if (breed && !catalog.includes(breed)) {
      catalog.push(breed);
    }
  });

  const recent = [];
  const seen = new Set();

  recentBreeds.forEach((entry) => {
    const breed =
      typeof entry === "string" ? entry : String(entry?.breed || "").trim();
    const entrySpecies =
      typeof entry === "string" ? "" : String(entry?.species || "");

    if (!breed) return;
    if (entrySpecies && species && entrySpecies !== species) return;
    if (seen.has(breed.toLocaleLowerCase("tr"))) return;

    seen.add(breed.toLocaleLowerCase("tr"));
    recent.push(breed);
  });

  const recentLimited = recent.slice(0, limitRecent);

  const frequent = [...freq.entries()]
    .filter(([breed]) => !seen.has(breed.toLocaleLowerCase("tr")))
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "tr"))
    .map(([breed]) => breed);

  frequent.forEach((breed) => seen.add(breed.toLocaleLowerCase("tr")));

  const rest = catalog
    .filter((breed) => !seen.has(breed.toLocaleLowerCase("tr")))
    .sort((a, b) => a.localeCompare(b, "tr"));

  return {
    options: [...recentLimited, ...frequent, ...rest],
    recentSet: new Set(recentLimited),
    frequentSet: new Set(frequent.slice(0, 8)),
  };
}

export function groupBreedOption(option, recentSet, frequentSet) {
  if (recentSet?.has(option)) return "Son kullanılanlar";
  if (frequentSet?.has(option)) return "Sık kullanılanlar";
  return "Tüm ırklar";
}
