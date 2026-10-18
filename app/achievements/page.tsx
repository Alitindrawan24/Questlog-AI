"use client";

import { useQuestStore } from "@/hooks/useQuestStore";
import { computeAchievements } from "@/lib/achievements";

export default function AchievementsPage() {
  const { habits, logs, assessments, isUpgraded, hasMounted } = useQuestStore();
  const list = computeAchievements({ habits, logs, assessments, isUpgraded });
  const unlockedCount = list.filter((a) => a.unlocked).length;

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-4 py-10 sm:px-6">
      <header>
        <h1 className="text-2xl font-extrabold text-amber-300">
          🏆 Achievements
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          {hasMounted ? (
            <>
              {unlockedCount}/{list.length} unlocked
            </>
          ) : (
            "Loading your trophies..."
          )}
        </p>
      </header>

      {/* Hydration placeholder */}
      {!hasMounted && (
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-xl border border-slate-800 bg-slate-900/50"
            />
          ))}
        </div>
      )}

      {/* Achievement grid */}
      {hasMounted && (
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {list.map((a) => (
            <div
              key={a.id}
              className={`flex items-center gap-4 rounded-xl border p-4 transition ${
                a.unlocked
                  ? "border-amber-400/40 bg-amber-500/5"
                  : "border-slate-800 bg-slate-900/40 opacity-60"
              }`}
            >
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg text-2xl ${
                  a.unlocked
                    ? "bg-amber-500/15 ring-1 ring-amber-400/40"
                    : "bg-slate-800 grayscale"
                }`}
              >
                {a.icon}
              </div>
              <div className="min-w-0">
                <h3
                  className={`text-sm font-bold ${
                    a.unlocked ? "text-amber-200" : "text-slate-400"
                  }`}
                >
                  {a.title}
                </h3>
                <p className="text-xs text-slate-500">{a.description}</p>
                {a.unlocked && (
                  <span className="mt-1 inline-block text-[10px] font-semibold uppercase tracking-wider text-emerald-400">
                    Unlocked
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
