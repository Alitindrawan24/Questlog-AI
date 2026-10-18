"use client";

import type { Assessment } from "@/types";

interface AssessmentBoardProps {
  assessment: Assessment | null;
  isLoading: boolean;
  error?: string | null;
}

export default function AssessmentBoard({
  assessment,
  isLoading,
  error,
}: AssessmentBoardProps) {
  return (
    <section className="rounded-2xl border border-amber-500/30 bg-slate-900/70 p-6 shadow-lg shadow-black/40">
      <div className="mb-4 flex items-center gap-2">
        <span className="text-xl">🗺️</span>
        <h2 className="text-lg font-bold text-amber-300">Weekly Assessment</h2>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center gap-3 py-8 text-slate-300">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent" />
          <span>The Game Master is reading your scrolls...</span>
        </div>
      )}

      {/* Error */}
      {!isLoading && error && (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-300">
          <p className="font-semibold">⚠️ Assessment failed</p>
          <p className="mt-1 text-red-300/80">{error}</p>
        </div>
      )}

      {/* Result */}
      {!isLoading && !error && assessment && (
        <div className="space-y-4">
          <div className="rounded-lg border border-amber-400/40 bg-amber-500/5 px-4 py-3">
            <p className="text-xs uppercase tracking-wider text-amber-400/70">
              Title Earned
            </p>
            <p className="mt-1 text-2xl font-bold text-amber-200">
              {assessment.title}
            </p>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wider text-cyan-400/70">
              Game Master's Analysis
            </p>
            <p className="mt-1 leading-relaxed text-slate-200">
              {assessment.analysis}
            </p>
          </div>

          <div className="rounded-lg border border-emerald-400/30 bg-emerald-500/5 px-4 py-3">
            <p className="text-xs uppercase tracking-wider text-emerald-400/70">
              Next Quest
            </p>
            <p className="mt-1 leading-relaxed text-emerald-100">
              {assessment.next_quest}
            </p>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !error && !assessment && (
        <div className="py-8 text-center text-slate-500">
          <p className="text-4xl">🕯️</p>
          <p className="mt-3 text-sm">
            No assessment yet. Complete a few quests, then summon the Game
            Master for a weekly evaluation.
          </p>
        </div>
      )}
    </section>
  );
}
