"use client";

import { useEffect, useRef, useState } from "react";
import type { Habit } from "@/types";

interface CheckInModalProps {
  habit: Habit | null;
  onSubmit: (note: string) => void;
  onClose: () => void;
}

const MIN_NOTE_LENGTH = 10;

export default function CheckInModal({
  habit,
  onSubmit,
  onClose,
}: CheckInModalProps) {
  const [note, setNote] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const open = habit !== null;

  // Reset + focus when a new habit opens; lock body scroll while open.
  useEffect(() => {
    if (open) {
      setNote("");
      // Focus on next tick so the element is mounted.
      const id = window.setTimeout(() => textareaRef.current?.focus(), 0);
      document.body.style.overflow = "hidden";
      return () => {
        window.clearTimeout(id);
        document.body.style.overflow = "";
      };
    }
  }, [open, habit?.id]);

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !habit) return null;

  const tooShort = note.trim().length < MIN_NOTE_LENGTH;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (tooShort) return;
    onSubmit(note.trim());
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="checkin-title"
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-amber-500/40 bg-slate-900 shadow-2xl shadow-black/50"
      >
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400 to-transparent" />

        <div className="flex items-center justify-between border-b border-slate-700/60 px-6 py-4">
          <h2 id="checkin-title" className="text-lg font-bold text-amber-300">
            📜 Quest Check-in
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-md px-2 py-1 text-slate-400 transition hover:bg-slate-700/50 hover:text-slate-200"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4 px-6 py-5">
          <div>
            <p className="text-sm text-slate-400">Logging completion for</p>
            <p className="text-xl font-semibold text-slate-100">{habit.name}</p>
          </div>

          <div>
            <label
              htmlFor="note"
              className="mb-1 block text-sm font-medium text-slate-300"
            >
              Journal Entry{" "}
              <span className="text-red-400" aria-hidden="true">
                *
              </span>
            </label>
            <textarea
              id="note"
              ref={textareaRef}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={5}
              required
              minLength={MIN_NOTE_LENGTH}
              placeholder="Describe your quest... How did it go? What did you overcome?"
              className="w-full resize-none rounded-lg border border-slate-600 bg-slate-950/60 px-3 py-2 text-slate-100 placeholder-slate-500 transition focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/30"
            />
            <p
              className={`mt-1 text-right text-xs ${
                tooShort ? "text-slate-500" : "text-emerald-400"
              }`}
            >
              {note.trim().length}/{MIN_NOTE_LENGTH} characters
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-700/60 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-700/40"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={tooShort}
            className="rounded-lg border border-amber-400/50 bg-amber-500/20 px-5 py-2 text-sm font-semibold text-amber-200 transition enabled:hover:border-amber-400 enabled:hover:bg-amber-500/30 disabled:cursor-not-allowed disabled:border-slate-700 disabled:bg-slate-800 disabled:text-slate-500"
          >
            Seal the Log
          </button>
        </div>
      </form>
    </div>
  );
}
