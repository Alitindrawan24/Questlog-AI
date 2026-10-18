"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Dashboard", icon: "🏠" },
  { href: "/history", label: "History", icon: "📜" },
  { href: "/achievements", label: "Achievements", icon: "🏆" },
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <nav className="mx-auto max-w-3xl px-4 sm:px-6">
      <div className="flex gap-2 rounded-xl border border-slate-800 bg-slate-900/60 p-1.5">
        {LINKS.map((l) => {
          const active = pathname === l.href;
          return (
            <Link
              key={l.href}
              href={l.href}
              aria-current={active ? "page" : undefined}
              className={`flex-1 rounded-lg border px-3 py-2 text-center text-sm font-medium transition ${
                active
                  ? "border-amber-400/40 bg-amber-500/10 text-amber-200"
                  : "border-transparent text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
              }`}
            >
              <span className="mr-1">{l.icon}</span>
              <span className="hidden sm:inline">{l.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
