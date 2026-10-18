"use client";

import type { Habit, Log } from "@/types";
import { dayKey, doneOnDay, last7Days, todayKey, weekdayLabel } from "@/lib/date";

interface DailyChecklistProps {
  habit: Habit;
  logs: Log[];
  /** Open the check-in modal to complete today (only used when today is empty). */
  onComplete: (habit: Habit) => void;
  /** Open a popup showing the journal note(s) for a completed day. */
  onViewDay: (habit: Habit, dateKey: string) => void;
}

export default function DailyChecklist({
  habit,
  logs,
  onComplete,
  onViewDay,
}: DailyChecklistProps) {
  const days = last7Days();
  const tKey = todayKey();

  return (
    <div
      role="group"
      aria-label={`7-day checklist for ${habit.name}`}
      className="flex justify-between gap-1"
    >
      {days.map((d) => {
        const key = dayKey(d);
        const done = doneOnDay(logs, habit.id, d);
        const isToday = key === tKey;
        const dateNum = d.getDate();

        return (
          <div key={key} className="flex flex-1 flex-col items-center gap-1">
            <span
              className={`text-[10px] uppercase ${
                isToday ? "font-bold text-amber-400" : "text-slate-500"
              }`}
            >
              {weekdayLabel(d)}
            </span>

            {done ? (
              // Completed day — click to view the journal note popup.
              <button
                type="button"
                onClick={() => onViewDay(habit, key)}
                aria-label={`View journal entry for ${habit.name} on ${key}`}
                className={`flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-400/50 bg-emerald-500/20 text-sm text-emerald-300 transition hover:border-emerald-400 hover:bg-emerald-500/30 hover:text-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-400/40 ${
                  isToday ? "ring-1 ring-amber-400/50" : ""
                }`}
              >
                ✓
              </button>
            ) : isToday ? (
              // Today, not yet completed — clickable to open check-in modal.
              <button
                type="button"
                onClick={() => onComplete(habit)}
                aria-label={`Complete ${habit.name} for today`}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-dashed border-amber-400/60 text-sm text-amber-300/80 transition hover:border-amber-400 hover:bg-amber-500/10 hover:text-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-400/40"
              >
                {dateNum}
              </button>
            ) : (
              // Past day, not completed — muted.
              <span
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-700/70 text-sm text-slate-600"
                aria-label={`Not completed on ${key}`}
              >
                {dateNum}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
