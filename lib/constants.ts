/** Curated habit categories (RPG-flavored) used by the add-habit select. */
export const HABIT_CATEGORIES = [
  "Mind",
  "Body",
  "Spirit",
  "Skill",
  "Social",
  "Wealth",
  "Rest",
  "Craft",
] as const;

/** Default category for a new habit draft. */
export const DEFAULT_CATEGORY: string = HABIT_CATEGORIES[0];

/** Possible target-frequencies per week (1..7 days). */
export const FREQUENCY_OPTIONS = [1, 2, 3, 4, 5, 6, 7] as const;
