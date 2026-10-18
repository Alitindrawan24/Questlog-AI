import type { Habit, Log, StoredAssessment } from "@/types";
import { currentStreak, weekCount } from "@/lib/date";

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
}

/**
 * Derive unlocked achievements from the user's local data. Achievements are
 * computed on the fly (not stored) so they always reflect current progress.
 */
export function computeAchievements(data: {
  habits: Habit[];
  logs: Log[];
  assessments: StoredAssessment[];
  isUpgraded: boolean;
}): Achievement[] {
  const { habits, logs, assessments, isUpgraded } = data;
  const totalLogs = logs.length;
  const maxStreak = habits.reduce(
    (m, h) => Math.max(m, currentStreak(logs, h.id)),
    0
  );
  const perfectWeek = habits.some(
    (h) => weekCount(logs, h.id) >= h.targetFrequency
  );

  return [
    {
      id: "first_quest",
      title: "First Quest",
      description: "Forge your first habit.",
      icon: "🗡️",
      unlocked: habits.length >= 1,
    },
    {
      id: "quest_collector",
      title: "Quest Collector",
      description: "Track 3 habits at once.",
      icon: "📜",
      unlocked: habits.length >= 3,
    },
    {
      id: "guildmaster",
      title: "Guildmaster",
      description: "Unlock the Guildmaster tier.",
      icon: "⭐",
      unlocked: isUpgraded,
    },
    {
      id: "first_checkin",
      title: "First Check-in",
      description: "Complete a quest for the first time.",
      icon: "✍️",
      unlocked: totalLogs >= 1,
    },
    {
      id: "scribe",
      title: "Scribe",
      description: "Write 10 journal entries.",
      icon: "📖",
      unlocked: totalLogs >= 10,
    },
    {
      id: "chronicler",
      title: "Chronicler",
      description: "Write 50 journal entries.",
      icon: "📚",
      unlocked: totalLogs >= 50,
    },
    {
      id: "streak_3",
      title: "Momentum",
      description: "Reach a 3-day streak on any quest.",
      icon: "🔥",
      unlocked: maxStreak >= 3,
    },
    {
      id: "streak_7",
      title: "Unbroken",
      description: "Reach a 7-day streak on any quest.",
      icon: "⚡",
      unlocked: maxStreak >= 7,
    },
    {
      id: "perfect_week",
      title: "Perfect Week",
      description: "Hit a quest's weekly target.",
      icon: "🎯",
      unlocked: perfectWeek,
    },
    {
      id: "assessment_seeker",
      title: "Assessment Seeker",
      description: "Generate your first weekly assessment.",
      icon: "🔮",
      unlocked: assessments.length >= 1,
    },
    {
      id: "historian",
      title: "Historian",
      description: "Generate 5 weekly assessments.",
      icon: "🏛️",
      unlocked: assessments.length >= 5,
    },
  ];
}
