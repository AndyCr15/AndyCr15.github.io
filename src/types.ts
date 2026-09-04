export interface Character {
  id: string;
  name: string;
  description: string;
  spoilers?: string;
  books: string[];
  series?: string[];
  role?: string;
  createdAt: number;
  updatedAt: number;
  // Backwards compatibility legacy field:
  book?: string;
}

export type BookSeriesMap = Record<string, string[]>;

export type ListingViewType = 'characters' | 'books' | 'series';

export const CHARACTER_ROLES = [
  'Protagonist',
  'Antagonist',
  'Supporting',
  'Mentor',
  'Love Interest',
  'Narrator',
  'Secondary',
  'Comic Relief',
  'Villain',
  'Minor',
] as const;

export const EXCLUDED_ROLES = new Set([
  'deuteragonist',
  'companion',
  'foil',
  'rival',
  'antihero',
  'driver',
  'confidant',
  'driver/confidant',
]);

export interface BookGroup {
  bookTitle: string;
  series: string[];
  characters: Character[];
}

export interface SeriesGroup {
  seriesName: string;
  books: {
    bookTitle: string;
    characters: Character[];
  }[];
  standaloneCharacters: Character[];
  allCharacters: Character[];
  totalCharacters: number;
}
