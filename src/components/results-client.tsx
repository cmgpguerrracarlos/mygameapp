"use client";

import Image from "next/image";
import Link from "next/link";
import { TournamentSummary } from "@/lib/types";

type ResultsClientProps = {
  summary: TournamentSummary;
};

export function ResultsClient({ summary }: ResultsClientProps) {
  const podium = [
    { label: "Champion", competitor: summary.podium.champion, accent: "bg-yellow-100 border-yellow-300" },
    { label: "Runner-up", competitor: summary.podium.runnerUp, accent: "bg-slate-100 border-slate-300" },
    { label: "Third place", competitor: summary.podium.thirdPlace, accent: "bg-orange-100 border-orange-300" },
  ];

  async function handleRestart() {
    await fetch("/api/session/end", { method: "POST" });
    window.location.href = "/api/session/start";
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
      <section className="glass-panel-strong rounded-[2rem] p-4 sm:p-6">
        <div className="grid gap-4 md:grid-cols-3">
          {podium.map((slot) => (
            <article key={slot.label} className={`rounded-[1.8rem] border p-4 ${slot.accent}`}>
              {slot.competitor ? (
                <>
                  <div className="relative h-56 overflow-hidden rounded-[1.4rem]">
                    <Image
                      src={slot.competitor.photoUrl}
                      alt={slot.competitor.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <p className="mt-4 text-xs font-semibold uppercase tracking-[0.24em] text-[var(--ink-soft)]">
                    {slot.label}
                  </p>
                  <h2 className="mt-2 text-2xl font-bold">{slot.competitor.name}</h2>
                  <p className="mt-3 text-sm text-[var(--ink-soft)]">
                    Rating {slot.competitor.rating} • {slot.competitor.wins}W / {slot.competitor.losses}L
                  </p>
                </>
              ) : (
                <div className="flex h-full min-h-64 items-center justify-center text-sm text-[var(--ink-soft)]">
                  Awaiting result
                </div>
              )}
            </article>
          ))}
        </div>

        <button
          type="button"
          onClick={handleRestart}
          className="mt-6 w-full rounded-full bg-[var(--accent)] px-6 py-4 text-sm font-semibold text-white shadow-lg shadow-orange-300/50 hover:bg-[var(--accent-strong)]"
        >
          Start New Tournament
        </button>
      </section>

      <aside className="glass-panel rounded-[2rem] p-4 sm:p-5">
        <h3 className="text-lg font-bold">Final standings</h3>
        <div className="mt-4 space-y-3">
          {summary.competitors.map((competitor, index) => (
            <div key={competitor.id} className="rounded-[1.4rem] border border-[var(--line)] bg-white/84 p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--ink-soft)]">
                #{index + 1}
              </p>
              <p className="mt-1 text-sm font-semibold">{competitor.name}</p>
              <p className="mt-1 text-xs text-[var(--ink-soft)]">
                Rating {competitor.rating} • {competitor.wins} wins • {competitor.losses} losses
              </p>
            </div>
          ))}
        </div>
        <Link
          href="/setup"
          className="mt-5 inline-flex rounded-full border border-[var(--line)] bg-white/85 px-4 py-2 text-sm font-semibold text-[var(--foreground)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
        >
          Edit another bracket
        </Link>
      </aside>
    </div>
  );
}
