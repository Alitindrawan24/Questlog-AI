"use client";

import { useEffect } from "react";
import type { Log } from "@/types";

interface NoteViewerProps {
  open: boolean;
  habitName: string | null;
  dateLabel: string;
  notes: Log[];
  onClose: () => void;
}

export default function NoteViewer({
  open,
  habitName,
  dateLabel,
  notes,
  onClose,
}: NoteViewerProps) {
  // Lock body scroll + close on Escape while open.
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open || !habitName) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="note-title"
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-emerald-400/40 bg-slate-900 shadow-2xl shadow-black/50">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400 to-transparent" />

        <div className="flex items-center justify-between border-b border-slate-700/60 px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-emerald-400/70">
              Completed Quest
            </p>
            <h2 id="note-title" className="text-lg font-bold text-emerald-300">
              {habitName}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-md px-2 py-1 text-slate-400 transition hover:bg-slate-700/50 hover:text-slate-200"
          >
            ✕
          </button>
        </div>

        <div className="px-6 py-5">
          <p className="mb-3 text-xs text-slate-400">{dateLabel}</p>

          {notes.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-500">
              No journal entry found for this day.
            </p>
          ) : (
            <div className="space-y-3">
              {notes.map((n) => (
                <blockquote
                  key={n.id}
                  className="rounded-lg border border-slate-700/60 bg-slate-950/50 px-4 py-3 text-sm leading-relaxed text-slate-200"
                >
                  {n.note}
                  <footer className="mt-2 text-right text-[10px] text-slate-500">
                    {new Date(n.date).toLocaleTimeString(undefined, {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </footer>
                </blockquote>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end border-t border-slate-700/60 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-700/40"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
