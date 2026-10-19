"use client";

import { useEffect, useRef, useState } from "react";
import { MAX_HABITS, PRO_MAX_HABITS } from "@/hooks/useQuestStore";

interface PurchaseModalProps {
  open: boolean;
  onClose: () => void;
  onPurchase: () => void;
}

/**
 * The upgrade code is baked into the client bundle at build time from the
 * NEXT_PUBLIC_UPGRADE_CODE env variable. An empty/missing value means no code
 * has been configured and the upgrade form will always reject.
 */
const UPGRADE_CODE = process.env.NEXT_PUBLIC_UPGRADE_CODE ?? "";

export default function PurchaseModal({
  open,
  onClose,
  onPurchase,
}: PurchaseModalProps) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset state + focus input each time the modal opens.
  useEffect(() => {
    if (open) {
      setCode("");
      setError(null);
      setSuccess(false);
      document.body.style.overflow = "hidden";
      const id = window.setTimeout(() => inputRef.current?.focus(), 0);
      return () => {
        window.clearTimeout(id);
        document.body.style.overflow = "";
      };
    } else {
      document.body.style.overflow = "";
    }
  }, [open]);

  // Close on Escape when not in the success state.
  useEffect(() => {
    if (!open || success) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, success, onClose]);

  if (!open) return null;

  function handleRedeem(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = code.trim();

    if (!UPGRADE_CODE) {
      setError("No upgrade code has been configured on this instance.");
      return;
    }

    if (trimmed.toUpperCase() !== UPGRADE_CODE.toUpperCase()) {
      setError("Invalid code. Please check and try again.");
      return;
    }

    // Code is correct — apply upgrade and show success.
    setError(null);
    setSuccess(true);
    onPurchase();
    window.setTimeout(() => onClose(), 1800);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="purchase-title"
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={() => !success && onClose()}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-amber-500/40 bg-slate-900 shadow-2xl shadow-black/50">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400 to-transparent" />

        <div className="flex items-center justify-between border-b border-slate-700/60 px-6 py-4">
          <h2 id="purchase-title" className="text-lg font-bold text-amber-300">
            ⭐ Guildmaster Upgrade
          </h2>
          {!success && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="rounded-md px-2 py-1 text-slate-400 transition hover:bg-slate-700/50 hover:text-slate-200"
            >
              ✕
            </button>
          )}
        </div>

        {success ? (
          /* ── Success state ── */
          <div className="px-6 py-10 text-center">
            <p className="text-5xl">🎉</p>
            <p className="mt-3 text-lg font-bold text-emerald-300">
              Upgrade unlocked!
            </p>
            <p className="mt-1 text-sm text-slate-400">
              You&apos;re now a Guildmaster. Your quest slots expanded to{" "}
              <span className="font-semibold text-amber-300">
                {PRO_MAX_HABITS}
              </span>
              .
            </p>
          </div>
        ) : (
          /* ── Code entry state ── */
          <form onSubmit={handleRedeem} className="px-6 py-5">
            <p className="text-sm text-slate-300">
              Expand your quest limit from{" "}
              <span className="font-semibold text-slate-100">{MAX_HABITS}</span>{" "}
              to{" "}
              <span className="font-semibold text-amber-300">
                {PRO_MAX_HABITS}
              </span>{" "}
              habit slots. Enter your upgrade code to unlock.
            </p>

            <ul className="mt-4 space-y-2 text-sm text-slate-300">
              <li className="flex items-center gap-2">
                <span className="text-emerald-400">✓</span> Track up to{" "}
                {PRO_MAX_HABITS} habits at once
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-400">✓</span> 3 AI assessments per
                day (vs 1 on free)
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-400">✓</span> All streaks &amp;
                data stay intact
              </li>
            </ul>

            <div className="mt-5 space-y-2">
              <label
                htmlFor="upgrade-code"
                className="block text-xs font-medium text-slate-300"
              >
                Upgrade Code
              </label>
              <input
                id="upgrade-code"
                ref={inputRef}
                type="text"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  setError(null);
                }}
                placeholder="e.g. GUILDMASTER2025"
                spellCheck={false}
                autoComplete="off"
                className="w-full rounded-lg border border-slate-600 bg-slate-950/60 px-3 py-2 font-mono text-sm uppercase tracking-widest text-slate-100 placeholder-slate-600 transition focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/30"
              />
              {error && (
                <p className="text-xs text-red-400" role="alert">
                  {error}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={code.trim().length === 0}
              className="mt-4 w-full rounded-lg border border-amber-400/50 bg-amber-500/20 px-5 py-3 text-sm font-semibold text-amber-200 transition enabled:hover:border-amber-400 enabled:hover:bg-amber-500/30 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Redeem Code
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
