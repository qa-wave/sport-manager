/**
 * Shared option lists for the Exercise editor — labels for selects, chip pickers,
 * and category dropdowns. Keep slugs in sync with training-library.ts and
 * physio-library.ts.
 */

export type CategoryOption = { slug: string; name: string; icon?: string };

export const CATEGORIES_TRAINING: CategoryOption[] = [
  { slug: 'warmup', name: 'Rozcvičení', icon: '🔥' },
  { slug: 'passing', name: 'Přihrávky', icon: '⚽' },
  { slug: 'shooting', name: 'Střelba', icon: '🎯' },
  { slug: 'dribbling', name: 'Dribling', icon: '💨' },
  { slug: 'defending', name: 'Obrana', icon: '🛡️' },
  { slug: 'fitness', name: 'Kondice', icon: '💪' },
  { slug: 'tactics', name: 'Taktika', icon: '🧠' },
  { slug: 'goalkeeping', name: 'Brankář', icon: '🧤' },
  { slug: 'game', name: 'Herní cvičení', icon: '🏟️' },
];

export const CATEGORIES_PHYSIO: CategoryOption[] = [
  { slug: 'warmup', name: 'Rozcvičení', icon: '🔥' },
  { slug: 'mobility', name: 'Mobilita', icon: '🧘' },
  { slug: 'core', name: 'Core', icon: '💪' },
  { slug: 'prevention-knee', name: 'Prevence kolen', icon: '🦵' },
  { slug: 'prevention-ankle', name: 'Prevence kotníků', icon: '🦶' },
  { slug: 'recovery', name: 'Regenerace', icon: '🌿' },
  { slug: 'strength', name: 'Síla', icon: '🏋️' },
  { slug: 'rehab', name: 'Návrat po zranění', icon: '🩹' },
];

export const BODY_AREAS_OPTIONS = [
  { value: 'koleno', label: 'Koleno' },
  { value: 'kotnik', label: 'Kotník' },
  { value: 'zada', label: 'Záda' },
  { value: 'ramena', label: 'Ramena' },
  { value: 'boky', label: 'Boky' },
  { value: 'krk', label: 'Krk' },
  { value: 'cele-telo', label: 'Celé tělo' },
];

export const PHYSIO_TYPE_OPTIONS = [
  { value: 'mobility', label: 'Mobilita' },
  { value: 'strength', label: 'Síla' },
  { value: 'balance', label: 'Balanc' },
  { value: 'flexibility', label: 'Flexibilita' },
  { value: 'recovery', label: 'Regenerace' },
];

export const SPORTS_OPTIONS = ['fotbal', 'florbal', 'universal'];

export const AGE_GROUPS_OPTIONS = ['U7', 'U9', 'U11', 'U13', 'U15', 'U17', 'senior'];

export const DIFFICULTY_OPTIONS = [
  { value: 'easy', label: 'Začátečník' },
  { value: 'medium', label: 'Pokročilý' },
  { value: 'hard', label: 'Expert' },
];
