"use client";

import { useQuestStore } from "@/hooks/useQuestStore";
import { formatDate } from "@/lib/date";

export default function HistoryPage() {
  const { assessments, hasMounted } = useQuestStore();

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-4 py-10 sm:px-6">
      <header>
        <h1 className="text-2xl font-extrabold text-amber-300">
          📜 Assessment History
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Your past Game Master evaluations, newest first.
        </p>
      </header>

      {/* Hydration placeholder */}
      {!hasMounted && (
        <div className="mt-8 h-40 animate-pulse rounded-xl border border-slate-800 bg-slate-900/50" />
      )}

      {/* Empty state */}
      {hasMounted && assessments.length === 0 && (
        <div className="mt-8 rounded-xl border border-slate-700/60 bg-slate-900/50 px-6 py-12 text-center text-slate-500">
          <p className="text-4xl">🕯️</p>
          <p className="mt-3 text-sm">
            No assessments yet. Generate a weekly evaluation from the dashboard to
            start your chronicle.
          </p>
        </div>
      )}

      {/* History list */}
      {hasMounted && assessments.length > 0 && (
        <div className="mt-8 space-y-4">
          {assessments.map((a) => (
            <article
              key={a.id}
              className="overflow-hidden rounded-xl border border-amber-500/30 bg-slate-900/70 p-5 shadow-lg shadow-black/40"
            >
              <div className="absolute" />
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="text-xl font-bold text-amber-200">{a.title}</h2>
                <time className="text-xs text-slate-500">
                  {formatDate(a.createdAt)}
                </time>
              </div>
              <p className="text-sm leading-relaxed text-slate-200">
                {a.analysis}
              </p>
              <div className="mt-3 rounded-lg border border-emerald-400/30 bg-emerald-500/5 px-4 py-3">
                <p className="text-xs uppercase tracking-wider text-emerald-400/70">
                  Next Quest
                </p>
                <p className="mt-1 text-sm leading-relaxed text-emerald-100">
                  {a.next_quest}
                </p>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
