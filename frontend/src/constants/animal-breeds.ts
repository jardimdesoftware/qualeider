export type AnimalType = "Vaca" | "Cabra" | "Ovelha" | "Bufala" | "Outro";

const sortBreeds = (arr: string[]) =>
  [...arr].sort((a, b) => {
    if (a === "Outro") return 1;
    if (b === "Outro") return -1;
    return a.localeCompare(b, "pt-BR");
  });

const UNSORTED: Record<AnimalType, string[]> = {
  Vaca: [
    "Holandês",
    "Jersey",
    "Pardo-Suíço",
    "Girolando",
    "Guzerá",
    "Gir Leiteiro",
    "Simental",
    "Ayrshire",
    "Normanda",
    "Red Poll",
    "Outro",
  ],
  Cabra: [
    "Saanen",
    "Toggenburg",
    "Alpina",
    "Anglo-Nubiana",
    "Murciana-Granadina",
    "LaMancha",
    "Parda Alpina",
    "Malagueña",
    "Outro",
  ],
  Ovelha: [
    "Lacaune",
    "East Friesian",
    "Assaf",
    "Awassi",
    "Manchega",
    "Sarda",
    "Churra",
    "British Milk Sheep",
    "Outro",
  ],
  Bufala: [
    "Murrah",
    "Jafarabadi",
    "Mediterrânea",
    "Surti",
    "Nili-Ravi",
    "Outro",
  ],
  Outro: ["Outro"],
};

export const BREED_OPTIONS: Record<AnimalType, string[]> = {
  Vaca: sortBreeds(UNSORTED.Vaca),
  Cabra: sortBreeds(UNSORTED.Cabra),
  Ovelha: sortBreeds(UNSORTED.Ovelha),
  Bufala: sortBreeds(UNSORTED.Bufala),
  Outro: sortBreeds(UNSORTED.Outro),
};

export const getBreedsByType = (type: string): string[] => {
  return BREED_OPTIONS[type as AnimalType] ?? [];
};
