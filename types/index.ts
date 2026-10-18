// Shared domain types for QuestLog AI.
// Kept in a standalone module so the server-side API route can import them
// without dragging the React-based hook into the server bundle.

export interface Habit {
  id: string;
  name: string;
  category: string;
  targetFrequency: number;
}

export interface Log {
  id: string;
  habitId: string;
  date: string;
  note: string;
}

export interface Assessment {
  title: string;
  analysis: string;
  next_quest: string;
}

/** An assessment that has been generated + persisted to history. */
export interface StoredAssessment extends Assessment {
  id: string;
  createdAt: string;
}
