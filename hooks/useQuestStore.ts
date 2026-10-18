"use client";

import { useCallback, useEffect, useState } from "react";
import type { Assessment, Habit, Log, StoredAssessment } from "@/types";
import { todayKey } from "@/lib/date";

const HABITS_KEY = "questlog:habits";
const LOGS_KEY = "questlog:logs";
const UPGRADED_KEY = "questlog:upgraded";
const ASSESSMENT_USAGE_KEY = "questlog:assessment-usage";
const ASSESSMENTS_KEY = "questlog:assessments";

/** Cap on how many past assessments we keep around. */
const MAX_ASSESSMENTS = 100;

/** Free-tier limit: a non-upgraded user may only track this many habits. */
export const MAX_HABITS = 3;
/** Guildmaster (pro) tier limit after the simulated purchase. */
export const PRO_MAX_HABITS = 10;

/** Daily "Generate Weekly Assessment" quota per tier. */
export const FREE_ASSESSMENT_LIMIT = 1;
export const PRO_ASSESSMENT_LIMIT = 3;

interface AssessmentUsage {
  /** Local YYYY-MM-DD the count applies to. */
  date: string;
  count: number;
}

/**
 * Safely read + parse a JSON value from localStorage. Returns the fallback
 * when running on the server, when the key is missing, or when parsing fails.
 */
function readJSON<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function uid(): string {
  // crypto.randomUUID is available in all modern browsers and Node 19+.
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export interface UseQuestStore {
  habits: Habit[];
  logs: Log[];
  /** True once the client has hydrated state from localStorage. */
  hasMounted: boolean;
  /** Whether the simulated Guildmaster upgrade has been purchased. */
  isUpgraded: boolean;
  /** Effective habit cap: 3 (free) or 10 (Guildmaster). */
  maxHabits: number;
  addHabit: (habit: Omit<Habit, "id">) => boolean;
  deleteHabit: (id: string) => void;
  addLog: (log: Omit<Log, "id" | "date">) => void;
  /** Simulate a successful purchase; raises the cap to PRO_MAX_HABITS. */
  purchaseUpgrade: () => void;
  /** How many assessments have been generated today (0 after a date rollover). */
  assessmentsToday: number;
  /** Daily assessment quota: 1 (free) or 3 (Guildmaster). */
  assessmentLimit: number;
  /** Remaining assessments available today. */
  assessmentsLeft: number;
  /** Whether the user can still generate an assessment today. */
  canAssess: boolean;
  /** Increment today's assessment usage counter. */
  recordAssessment: () => void;
  /** Persisted past assessments, newest first. */
  assessments: StoredAssessment[];
  /** Prepend a generated assessment to history (capped). */
  saveAssessment: (a: Assessment) => void;
}

/**
 * Custom hook that persists habits + logs to localStorage and exposes
 * mutation helpers. State is hydrated on mount and re-persisted on change.
 */
export function useQuestStore(): UseQuestStore {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [hasMounted, setHasMounted] = useState(false);
  const [isUpgraded, setIsUpgraded] = useState(false);
  const [assessmentUsage, setAssessmentUsage] = useState<AssessmentUsage>({
    date: "",
    count: 0,
  });
  const [assessments, setAssessments] = useState<StoredAssessment[]>([]);

  const maxHabits = isUpgraded ? PRO_MAX_HABITS : MAX_HABITS;

  // Hydrate from localStorage on first client render.
  useEffect(() => {
    setHabits(readJSON<Habit[]>(HABITS_KEY, []));
    setLogs(readJSON<Log[]>(LOGS_KEY, []));
    const stored = readJSON<{ isUpgraded?: boolean }>(UPGRADED_KEY, {});
    setIsUpgraded(Boolean(stored.isUpgraded));
    setAssessmentUsage(
      readJSON<AssessmentUsage>(ASSESSMENT_USAGE_KEY, { date: "", count: 0 })
    );
    setAssessments(readJSON<StoredAssessment[]>(ASSESSMENTS_KEY, []));
    setHasMounted(true);
  }, []);

  // Today's assessment count — resets implicitly when the date rolls over.
  const assessmentsToday =
    assessmentUsage.date === todayKey() ? assessmentUsage.count : 0;
  const assessmentLimit = isUpgraded
    ? PRO_ASSESSMENT_LIMIT
    : FREE_ASSESSMENT_LIMIT;
  const assessmentsLeft = Math.max(0, assessmentLimit - assessmentsToday);
  const canAssess = assessmentsToday < assessmentLimit;

  // Persist habits back to localStorage whenever they change.
  useEffect(() => {
    if (!hasMounted) return;
    try {
      window.localStorage.setItem(HABITS_KEY, JSON.stringify(habits));
    } catch {
      /* ignore quota / serialization errors */
    }
  }, [habits, hasMounted]);

  // Persist logs back to localStorage whenever they change.
  useEffect(() => {
    if (!hasMounted) return;
    try {
      window.localStorage.setItem(LOGS_KEY, JSON.stringify(logs));
    } catch {
      /* ignore quota / serialization errors */
    }
  }, [logs, hasMounted]);

  // Persist upgrade state back to localStorage.
  useEffect(() => {
    if (!hasMounted) return;
    try {
      window.localStorage.setItem(
        UPGRADED_KEY,
        JSON.stringify({ isUpgraded, upgradedAt: isUpgraded ? new Date().toISOString() : null })
      );
    } catch {
      /* ignore */
    }
  }, [isUpgraded, hasMounted]);

  // Persist assessment usage back to localStorage.
  useEffect(() => {
    if (!hasMounted) return;
    try {
      window.localStorage.setItem(
        ASSESSMENT_USAGE_KEY,
        JSON.stringify(assessmentUsage)
      );
    } catch {
      /* ignore */
    }
  }, [assessmentUsage, hasMounted]);

  // Persist assessment history back to localStorage.
  useEffect(() => {
    if (!hasMounted) return;
    try {
      window.localStorage.setItem(ASSESSMENTS_KEY, JSON.stringify(assessments));
    } catch {
      /* ignore */
    }
  }, [assessments, hasMounted]);

  const addHabit = useCallback(
    (habit: Omit<Habit, "id">) => {
      let added = false;
      const limit = isUpgraded ? PRO_MAX_HABITS : MAX_HABITS;
      setHabits((prev) => {
        if (prev.length >= limit) return prev;
        added = true;
        return [...prev, { ...habit, id: uid() }];
      });
      return added;
    },
    [isUpgraded]
  );

  const deleteHabit = useCallback((id: string) => {
    setHabits((prev) => prev.filter((h) => h.id !== id));
    // Cascade: remove logs that belonged to the deleted habit.
    setLogs((prev) => prev.filter((l) => l.habitId !== id));
  }, []);

  const addLog = useCallback((log: Omit<Log, "id" | "date">) => {
    setLogs((prev) => [
      ...prev,
      { ...log, id: uid(), date: new Date().toISOString() },
    ]);
  }, []);

  const purchaseUpgrade = useCallback(() => {
    setIsUpgraded(true);
  }, []);

  const recordAssessment = useCallback(() => {
    setAssessmentUsage((prev) => {
      const tKey = todayKey();
      if (prev.date !== tKey) return { date: tKey, count: 1 };
      return { date: tKey, count: prev.count + 1 };
    });
  }, []);

  const saveAssessment = useCallback((a: Assessment) => {
    const entry: StoredAssessment = {
      ...a,
      id: uid(),
      createdAt: new Date().toISOString(),
    };
    setAssessments((prev) => [entry, ...prev].slice(0, MAX_ASSESSMENTS));
  }, []);

  return {
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
    assessments,
    saveAssessment,
  };
}
