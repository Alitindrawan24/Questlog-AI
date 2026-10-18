"use client";

import { useState } from "react";
import { useQuestStore } from "@/hooks/useQuestStore";
import { DEFAULT_CATEGORY, FREQUENCY_OPTIONS, HABIT_CATEGORIES } from "@/lib/constants";
import { dayKey, formatDate } from "@/lib/date";
import type { Assessment, Habit, Log } from "@/types";
import HabitCard from "@/components/HabitCard";
import CheckInModal from "@/components/CheckInModal";
import AssessmentBoard from "@/components/AssessmentBoard";
import PurchaseModal from "@/components/PurchaseModal";
import NoteViewer from "@/components/NoteViewer";

interface NewHabitDraft {
  name: string;
  category: string;
  targetFrequency: number;
}

const EMPTY_DRAFT: NewHabitDraft = {
  name: "",
  category: DEFAULT_CATEGORY,
  targetFrequency: 1,
};

export default function Home() {
  const {
    habits,
    logs,
    hasMounted,
    isUpgraded,
    maxHabits,
    addHabit,
    deleteHabit,
    addLog,
    purchaseUpgrade,
    assessmentsToday,
    assessmentLimit,
    assessmentsLeft,
    canAssess,
    recordAssessment,
    saveAssessment,
  } = useQuestStore();

  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState<NewHabitDraft>(EMPTY_DRAFT);
  const [purchaseOpen, setPurchaseOpen] = useState(false);
  const [viewDay, setViewDay] = useState<{ habit: Habit; dateKey: string } | null>(
    null
  );

  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const atLimit = habits.length >= maxHabits;

  function handleSubmitHabit(e: React.FormEvent) {
    e.preventDefault();
    if (atLimit) return;
    if (!draft.name.trim()) return;
    addHabit({
      name: draft.name.trim(),
      category: draft.category || DEFAULT_CATEGORY,
      targetFrequency: Number(draft.targetFrequency) || 1,
    });
    setDraft(EMPTY_DRAFT);
    setShowForm(false);
  }

  function handleCheckInSubmit(note: string) {
    if (!selectedHabit) return;
    addLog({ habitId: selectedHabit.id, note });
    setSelectedHabit(null);
  }

  function handleViewDay(habit: Habit, dateKey: string) {
    setViewDay({ habit, dateKey });
  }

  const viewDayNotes: Log[] = viewDay
    ? logs.filter(
        (l) =>
          l.habitId === viewDay.habit.id &&
          dayKey(new Date(l.date)) === viewDay.dateKey
      )
    : [];

  async function handleAssessment() {
    if (!canAssess) return;
    setIsLoading(true);
    setError(null);
    setAssessment(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logs, habits }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error ?? "Failed to generate assessment.");
      }
      setAssessment(data as Assessment);
      // Persist to history + count against the daily quota (only on success).
      saveAssessment(data as Assessment);
      recordAssessment();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-4 py-10 sm:px-6">
      {/* Header */}
      <header className="text-center">
        <h1 className="bg-gradient-to-r from-amber-300 via-emerald-300 to-cyan-300 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent sm:text-5xl">
          QuestLog AI
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Track your habits like quests. Let the Game Master judge your week.
        </p>
        {hasMounted && isUpgraded && (
          <span className="mt-3 inline-block rounded-full border border-amber-400/40 bg-amber-500/10 px-3 py-0.5 text-xs font-semibold text-amber-300">
            ⭐ Guildmaster Tier
          </span>
        )}
      </header>

      {/* Habits section */}
      <section className="mt-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-amber-300">Active Quests</h2>
          <span className="text-xs text-slate-400">
            {hasMounted ? habits.length : 0}/{maxHabits} habits
          </span>
        </div>

        {/* Habit grid */}
        <div className="grid gap-4 sm:grid-cols-2">
          {hasMounted &&
            habits.map((habit) => (
              <HabitCard
                key={habit.id}
                habit={habit}
                logs={logs}
                onComplete={setSelectedHabit}
                onViewDay={handleViewDay}
                onDelete={deleteHabit}
              />
            ))}
        </div>

        {/* Empty state (only after mount to avoid hydration mismatch) */}
        {hasMounted && habits.length === 0 && !showForm && (
          <div className="rounded-xl border border-slate-700/60 bg-slate-900/50 px-6 py-10 text-center text-slate-500">
            <p className="text-3xl">🗡️</p>
            <p className="mt-2 text-sm">
              No quests yet. Forge your first habit below to begin your journey.
            </p>
          </div>
        )}

        {/* Hydration placeholder */}
        {!hasMounted && (
          <div className="h-32 animate-pulse rounded-xl border border-slate-800 bg-slate-900/50" />
        )}

        {/* Add habit form */}
        {showForm && !atLimit && (
          <form
            onSubmit={handleSubmitHabit}
            className="mt-4 rounded-xl border border-amber-500/30 bg-slate-900/70 p-5"
          >
            <h3 className="mb-3 text-sm font-semibold text-amber-300">
              ⚒️ Forge a New Quest
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs text-slate-400" htmlFor="habit-name">
                  Name
                </label>
                <input
                  id="habit-name"
                  value={draft.name}
                  onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                  placeholder="e.g. Morning Workout"
                  required
                  className="w-full rounded-lg border border-slate-600 bg-slate-950/60 px-3 py-2 text-slate-100 placeholder-slate-500 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/30"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-400" htmlFor="habit-cat">
                  Category
                </label>
                <select
                  id="habit-cat"
                  value={draft.category}
                  onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value }))}
                  className="w-full rounded-lg border border-slate-600 bg-slate-950/60 px-3 py-2 text-slate-100 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/30"
                >
                  {HABIT_CATEGORIES.map((c) => (
                    <option key={c} value={c} className="bg-slate-900">
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <fieldset className="sm:col-span-2">
                <legend className="mb-1 text-xs text-slate-400">
                  Target / week
                </legend>
                <div className="flex gap-1.5">
                  {FREQUENCY_OPTIONS.map((n) => (
                    <label
                      key={n}
                      className="flex-1 cursor-pointer"
                      title={`${n}× per week`}
                    >
                      <input
                        type="radio"
                        name="habit-freq"
                        value={n}
                        checked={draft.targetFrequency === n}
                        onChange={() =>
                          setDraft((d) => ({ ...d, targetFrequency: n }))
                        }
                        className="peer sr-only"
                      />
                      <span className="flex h-9 items-center justify-center rounded-lg border border-slate-600 text-sm text-slate-300 transition hover:border-slate-500 peer-checked:border-emerald-400 peer-checked:bg-emerald-500/20 peer-checked:text-emerald-200">
                        {n}
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
            </div>
            <div className="mt-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setDraft(EMPTY_DRAFT);
                }}
                className="rounded-lg px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-700/40"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg border border-amber-400/50 bg-amber-500/20 px-5 py-2 text-sm font-semibold text-amber-200 transition hover:border-amber-400 hover:bg-amber-500/30"
              >
                Forge Quest
              </button>
            </div>
          </form>
        )}

        {/* Add habit button / limit warning */}
        <div className="mt-4">
          {!showForm && (
            <button
              type="button"
              disabled={atLimit}
              onClick={() => setShowForm(true)}
              className="w-full rounded-lg border border-dashed border-slate-600 px-4 py-3 text-sm font-medium text-slate-300 transition enabled:hover:border-amber-400/60 enabled:hover:text-amber-200 disabled:cursor-not-allowed disabled:border-slate-800 disabled:text-slate-600"
            >
              {atLimit ? "🔒 Habit limit reached" : "+ Add Habit"}
            </button>
          )}
          {atLimit && (
            <p className="mt-2 text-center text-xs text-amber-400/80">
              {isUpgraded
                ? `Limit reached (${habits.length}/${maxHabits} habits). Delete one to add another.`
                : `Free tier limit reached (${habits.length}/${maxHabits} habits). Upgrade to Guildmaster for 10 slots.`}
            </p>
          )}
        </div>

        {/* Upgrade CTA — only for the free tier */}
        {hasMounted && !isUpgraded && !showForm && (
          <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 to-transparent px-5 py-4">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-amber-200">
                ⭐ Unlock Guildmaster
              </p>
              <p className="truncate text-xs text-slate-400">
                Raise your quest limit from 3 to 10 slots. One-time, simulated.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setPurchaseOpen(true)}
              className="shrink-0 rounded-lg border border-amber-400/50 bg-amber-500/20 px-4 py-2 text-sm font-semibold text-amber-200 transition hover:border-amber-400 hover:bg-amber-500/30"
            >
              Upgrade
            </button>
          </div>
        )}
      </section>

      {/* AI assessment section */}
      <section className="mt-10">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-bold text-amber-300">Game Master</h2>
          <button
            type="button"
            onClick={handleAssessment}
            disabled={isLoading || !hasMounted || logs.length === 0 || !canAssess}
            className="rounded-lg border border-emerald-400/50 bg-emerald-500/20 px-5 py-2 text-sm font-semibold text-emerald-200 transition enabled:hover:border-emerald-400 enabled:hover:bg-emerald-500/30 disabled:cursor-not-allowed disabled:border-slate-700 disabled:bg-slate-800 disabled:text-slate-500"
          >
            {isLoading ? "Divining..." : "🔮 Generate Weekly Assessment"}
          </button>
        </div>

        {/* Daily quota indicator */}
        {hasMounted && (
          <div className="mb-4 flex items-center justify-between text-xs">
            <span className="text-slate-400">
              Assessments today:{" "}
              <span className="font-semibold text-slate-200">
                {assessmentsToday}/{assessmentLimit}
              </span>
            </span>
            {canAssess ? (
              <span className="text-emerald-400/80">
                {assessmentsLeft} left today
              </span>
            ) : (
              <span className="text-amber-400/80">Limit reached today</span>
            )}
          </div>
        )}

        {/* Daily limit message */}
        {hasMounted && !canAssess && (
          <p className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-xs text-amber-300/90">
            {isUpgraded
              ? "You've used all 3 Guildmaster assessments for today. Resets tomorrow."
              : "Free tier allows 1 assessment per day and you've used it. Upgrade to Guildmaster for 3 per day."}
            {!isUpgraded && (
              <button
                type="button"
                onClick={() => setPurchaseOpen(true)}
                className="ml-1 underline decoration-dotted underline-offset-2 hover:text-amber-200"
              >
                Upgrade
              </button>
            )}
          </p>
        )}

        <AssessmentBoard
          assessment={assessment}
          isLoading={isLoading}
          error={error}
        />
      </section>

      <footer className="mt-12 text-center text-xs text-slate-600">
        QuestLog AI · Data stored locally in your browser
      </footer>

      {/* Modal is rendered at the root level and controlled by state */}
      <CheckInModal
        habit={selectedHabit}
        onSubmit={handleCheckInSubmit}
        onClose={() => setSelectedHabit(null)}
      />

      {/* Simulated purchase modal */}
      <PurchaseModal
        open={purchaseOpen}
        onClose={() => setPurchaseOpen(false)}
        onPurchase={purchaseUpgrade}
      />

      {/* Completed-quest note viewer */}
      <NoteViewer
        open={viewDay !== null}
        habitName={viewDay?.habit.name ?? null}
        dateLabel={viewDay ? formatDate(`${viewDay.dateKey}T12:00:00`) : ""}
        notes={viewDayNotes}
        onClose={() => setViewDay(null)}
      />
    </main>
  );
}
