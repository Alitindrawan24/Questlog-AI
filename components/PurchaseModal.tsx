"use client";

import { useEffect, useState } from "react";
import { MAX_HABITS, PRO_MAX_HABITS } from "@/hooks/useQuestStore";

interface PurchaseModalProps {
  open: boolean;
  onClose: () => void;
  onPurchase: () => void;
}

const PRICE = "$4.99";
const PROCESSING_MS = 1500;

export default function PurchaseModal({
  open,
  onClose,
  onPurchase,
}: PurchaseModalProps) {
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  // Reset internal state whenever the modal is (re)opened.
  useEffect(() => {
    if (open) {
      setProcessing(false);
      setSuccess(false);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Close on Escape (only when not mid-transaction).
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !processing) onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, processing, onClose]);

  if (!open) return null;

  function handlePay() {
    setProcessing(true);
    // Simulate a payment gateway round-trip (no real charge).
    window.setTimeout(() => {
      setProcessing(false);
      setSuccess(true);
      onPurchase();
      window.setTimeout(() => onClose(), 1300);
    }, PROCESSING_MS);
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
        onClick={() => !processing && onClose()}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-amber-500/40 bg-slate-900 shadow-2xl shadow-black/50">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400 to-transparent" />

        <div className="flex items-center justify-between border-b border-slate-700/60 px-6 py-4">
          <h2 id="purchase-title" className="text-lg font-bold text-amber-300">
            ⭐ Guildmaster Upgrade
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={processing}
            aria-label="Close"
            className="rounded-md px-2 py-1 text-slate-400 transition hover:bg-slate-700/50 hover:text-slate-200 disabled:opacity-40"
          >
            ✕
          </button>
        </div>

        {success ? (
          <div className="px-6 py-10 text-center">
            <p className="text-5xl">🎉</p>
            <p className="mt-3 text-lg font-bold text-emerald-300">
              Upgrade complete!
            </p>
            <p className="mt-1 text-sm text-slate-400">
              You&apos;re now a Guildmaster. Your quest slots expanded to{" "}
              {PRO_MAX_HABITS}.
            </p>
          </div>
        ) : (
          <div className="px-6 py-5">
            <p className="text-sm text-slate-300">
              Expand your active quest limit from{" "}
              <span className="font-semibold text-slate-100">{MAX_HABITS}</span> to{" "}
              <span className="font-semibold text-amber-300">
                {PRO_MAX_HABITS}
              </span>{" "}
              habit slots.
            </p>

            <ul className="mt-4 space-y-2 text-sm text-slate-300">
              <li className="flex items-center gap-2">
                <span className="text-emerald-400">✓</span> Track up to{" "}
                {PRO_MAX_HABITS} habits at once
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-400">✓</span> Keep your streaks &
                all existing quests
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-400">✓</span> Stored locally — no
                account needed
              </li>
            </ul>

            <div className="mt-5 flex items-end justify-between rounded-lg border border-slate-700/60 bg-slate-950/50 px-4 py-3">
              <span className="text-xs uppercase tracking-wider text-slate-500">
                One-time · simulated
              </span>
              <span className="text-2xl font-bold text-amber-300">{PRICE}</span>
            </div>

            <button
              type="button"
              onClick={handlePay}
              disabled={processing}
              className="mt-4 w-full rounded-lg border border-amber-400/50 bg-amber-500/20 px-5 py-3 text-sm font-semibold text-amber-200 transition hover:border-amber-400 hover:bg-amber-500/30 disabled:cursor-wait disabled:opacity-70"
            >
              {processing ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-amber-300 border-t-transparent" />
                  Processing simulated payment...
                </span>
              ) : (
                `Simulate Payment (${PRICE})`
              )}
            </button>

            <p className="mt-3 text-center text-xs text-slate-600">
              Simulation only — no real charge, no card required.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
