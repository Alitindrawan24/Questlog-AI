import type { Log } from "@/types";

/** Local YYYY-MM-DD key for a Date (avoids UTC off-by-one). */
export function dayKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Local YYYY-MM-DD for today. */
export function todayKey(): string {
  return dayKey(new Date());
}

/** The last 7 calendar days, oldest -> newest (today is last). */
export function last7Days(): Date[] {
  const now = new Date();
  const days: Date[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    days.push(d);
  }
  return days;
}

/** Single-letter weekday label (S M T W T F S). */
export function weekdayLabel(d: Date): string {
  return ["S", "M", "T", "W", "T", "F", "S"][d.getDay()];
}

/** Human-readable local date for an ISO string, e.g. "Oct 19, 2026". */
export function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

/** Whether a habit has at least one log on the given day. */
export function doneOnDay(logs: Log[], habitId: string, day: Date): boolean {
  const key = dayKey(day);
  return logs.some(
    (l) => l.habitId === habitId && dayKey(new Date(l.date)) === key
  );
}

/** Whether the habit was completed today. */
export function isDoneToday(logs: Log[], habitId: string): boolean {
  return doneOnDay(logs, habitId, new Date());
}

/** Number of completed days within the last 7 days. */
export function weekCount(logs: Log[], habitId: string): number {
  return last7Days().filter((d) => doneOnDay(logs, habitId, d)).length;
}

/**
 * Current streak: consecutive days completed counting back from today.
 * If today isn't done yet, the streak still reflects the run up to yesterday.
 */
export function currentStreak(logs: Log[], habitId: string): number {
  let streak = 0;
  const now = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    if (doneOnDay(logs, habitId, d)) {
      streak++;
    } else if (i === 0) {
      // Today not done yet — don't break the streak, measure from yesterday.
      continue;
    } else {
      break;
    }
  }
  return streak;
}
