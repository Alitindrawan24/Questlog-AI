"use client";

import type { Habit, Log } from "@/types";
import { currentStreak, isDoneToday, weekCount } from "@/lib/date";
import DailyChecklist from "./DailyChecklist";

interface HabitCardProps {
  habit: Habit;
  logs: Log[];
  onComplete: (habit: Habit) => void;
  onViewDay: (habit: Habit, dateKey: string) => void;
  onDelete: (id: string) => void;
}

export default function HabitCard({
  habit,
  logs,
  onComplete,
  onViewDay,
  onDelete,
}: HabitCardProps) {
  const doneToday = isDoneToday(logs, habit.id);
  const count = weekCount(logs, habit.id);
  const streak = currentStreak(logs, habit.id);
  const pct = habit.targetFrequency
    ? Math.min(100, Math.round((count / habit.targetFrequency) * 100))
    : 0;

  return (
    <div className="group relative overflow-hidden rounded-xl border border-amber-500/30 bg-slate-900/70 p-5 shadow-lg shadow-black/40 transition hover:border-amber-400/60 hover:shadow-amber-500/10">
      {/* Neon top accent */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/70 to-transparent" />

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <span className="inline-block rounded-full border border-cyan-400/30 bg-cyan-400/10 px-2 py-0.5 text-xs font-medium text-cyan-300">
            {habit.category}
          </span>
          <h3 className="mt-2 truncate text-lg font-semibold text-slate-100">
            {habit.name}
          </h3>
          <p className="mt-1 text-sm text-slate-400">
            Target:{" "}
            <span className="font-medium text-amber-300">
              {habit.targetFrequency}× / week
            </span>
          </p>
        </div>

        <button
          type="button"
          onClick={() => onDelete(habit.id)}
          aria-label={`Delete habit ${habit.name}`}
          className="shrink-0 rounded-md px-2 py-1 text-xs text-slate-500 transition hover:bg-red-500/10 hover:text-red-400"
        >
          ✕
        </button>
      </div>

      {/* 7-day daily checklist */}
      <div className="mt-4">
        <DailyChecklist
          habit={habit}
          logs={logs}
          onComplete={onComplete}
          onViewDay={onViewDay}
        />
      </div>

      {/* Weekly progress + streak */}
      <div className="mt-4">
        <div className="mb-1 flex items-center justify-between text-xs">
          <span className="text-slate-400">
            This week:{" "}
            <span className="font-semibold text-slate-200">
              {count}/{habit.targetFrequency}
            </span>
          </span>
          {streak > 0 && (
            <span className="font-medium text-amber-300" title="Current streak">
              🔥 {streak} day{streak === 1 ? "" : "s"}
            </span>
          )}
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-400 transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Complete / done-today button */}
      <button
        type="button"
        onClick={() => onComplete(habit)}
        disabled={doneToday}
        className="mt-4 w-full rounded-lg border px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-emerald-400/50 enabled:border-emerald-400/40 enabled:bg-emerald-500/10 enabled:text-emerald-300 enabled:hover:border-emerald-400 enabled:hover:bg-emerald-500/20 enabled:hover:text-emerald-200 disabled:cursor-default disabled:border-emerald-500/30 disabled:bg-emerald-500/10 disabled:text-emerald-300/70"
      >
        {doneToday ? "✓ Completed today" : "⚔️ Complete Quest"}
      </button>
    </div>
  );
}
