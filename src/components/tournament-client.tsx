"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { TournamentSummary } from "@/lib/types";

type TournamentClientProps = {
  initialSummary: TournamentSummary;
};

function scoreLabel(summary: TournamentSummary) {
  if (!summary.currentMatch) {
    return "Tournament complete";
  }

  const event = summary.currentMatch.currentEvent;

  if (!event) {
    return "Ready for kickoff";
  }

  return `${event.scoreA} - ${event.scoreB}`;
}

export function TournamentClient({ initialSummary }: TournamentClientProps) {
  const router = useRouter();
  const [summary, setSummary] = useState(initialSummary);
  const [busy, setBusy] = useState(false);

  async function handleNext() {
    setBusy(true);
    const response = await fetch("/api/match/next", { method: "POST" });
    const payload = await response.json();

    if (response.ok) {
      setSummary(payload);

      if (payload.tournament?.status === "completed") {
        router.push("/results");
        router.refresh();
        return;
      }
    }

    setBusy(false);
  }

  const currentMatch = summary.currentMatch;

  if (!summary.tournament) {
    return (
      <section className="glass-panel-strong rounded-[2rem] p-6">
        <p className="text-sm text-[var(--ink-soft)]">No tournament is active yet.</p>
        <Link href="/setup" className="mt-4 inline-flex rounded-full bg-[var(--foreground)] px-5 py-3 text-sm font-semibold text-white">
          Go to setup
        </Link>
      </section>
    );
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[1.45fr_0.95fr]">
      <section className="glass-panel-strong rounded-[2rem] p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--ink-soft)]">
              {currentMatch?.roundLabel ?? "Final standings"}
            </p>
            <h2 className="mt-2 text-2xl font-bold">
              {currentMatch ? `${currentMatch.competitorA.name} vs ${currentMatch.competitorB.name}` : "Champion decided"}
            </h2>
          </div>
          <div className="rounded-[1.4rem] bg-[var(--accent-soft)] px-4 py-3 text-right">
            <p className="text-xs uppercase tracking-[0.18em] text-[var(--accent-strong)]">Live score</p>
            <p className="font-mono text-2xl font-semibold">{scoreLabel(summary)}</p>
          </div>
        </div>

        {currentMatch ? (
          <>
            <div className="mt-6 grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-center">
              {[currentMatch.competitorA, currentMatch.competitorB].map((competitor) => {
                const isWinner = currentMatch.winnerId === competitor.id;
                const isLoser = currentMatch.loserId === competitor.id;

                return (
                  <article
                    key={competitor.id}
                    className={`rounded-[1.8rem] border px-4 py-4 ${
                      isWinner
                        ? "border-emerald-300 bg-emerald-50"
                        : isLoser
                          ? "border-red-200 bg-red-50"
                          : "border-[var(--line)] bg-white/85"
                    }`}
                  >
                    <div className="relative h-44 overflow-hidden rounded-[1.4rem]">
                      <Image
                        src={competitor.photoUrl}
                        alt={competitor.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="mt-4">
                      <h3 className="text-xl font-bold">{competitor.name}</h3>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--ink-soft)]">
                        <span className="rounded-full bg-slate-100 px-3 py-1">Rating {competitor.rating}</span>
                        <span className="rounded-full bg-slate-100 px-3 py-1">
                          {competitor.wins}W / {competitor.losses}L
                        </span>
                      </div>
                      {isWinner ? (
                        <p className="mt-3 text-sm font-semibold text-emerald-700">Winner revealed</p>
                      ) : null}
                    </div>
                  </article>
                );
              })}
              <div className="mx-auto hidden h-16 w-16 items-center justify-center rounded-full border border-[var(--line)] bg-white/80 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--ink-soft)] md:flex">
                VS
              </div>
            </div>

            <div className="mt-6 rounded-[1.6rem] border border-[var(--line)] bg-[#fffaf3] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--ink-soft)]">Simulation</p>
              <p className="mt-3 text-lg font-medium text-balance">
                {currentMatch.currentEvent?.label ?? "Tap next to start the match simulation."}
              </p>
              <div className="mt-4 flex gap-2">
                {Array.from({ length: currentMatch.totalSteps }, (_, index) => (
                  <span
                    key={index}
                    className={`h-2 flex-1 rounded-full ${
                      currentMatch.simulationStep >= index ? "bg-[var(--accent)]" : "bg-slate-200"
                    }`}
                  />
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="mt-6 rounded-[1.6rem] border border-emerald-200 bg-emerald-50 p-5">
            <p className="text-lg font-semibold">The podium is ready.</p>
            <p className="mt-2 text-sm text-emerald-800">The next screen shows the champion, runner-up, and third place.</p>
          </div>
        )}

        <button
          type="button"
          onClick={handleNext}
          disabled={busy}
          className="mt-6 w-full rounded-full bg-[var(--foreground)] px-6 py-4 text-sm font-semibold text-white shadow-lg shadow-slate-400/30 hover:bg-slate-800 disabled:cursor-wait disabled:opacity-70"
        >
          {busy ? "Updating..." : currentMatch?.status === "completed" ? "Advance to next match" : "Next"}
        </button>
      </section>

      <aside className="glass-panel rounded-[2rem] p-4 sm:p-5">
        <h3 className="text-lg font-bold">Bracket overview</h3>
        <div className="mt-4 space-y-4">
          {Array.from(new Set(summary.matches.map((match) => match.round))).map((round) => {
            const matches = summary.matches.filter((match) => match.round === round);
            return (
              <div key={round} className="rounded-[1.4rem] border border-[var(--line)] bg-white/80 p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--ink-soft)]">
                  Round {round}
                </p>
                <div className="mt-3 space-y-2">
                  {matches.map((match) => (
                    <div key={match.id} className="rounded-2xl border border-[var(--line)] bg-[#fffcf7] p-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--ink-soft)]">
                        {match.roundLabel}
                      </p>
                      <p className="mt-1 text-sm font-semibold">
                        {match.competitorA.name} vs {match.competitorB.name}
                      </p>
                      <p className="mt-2 text-xs text-[var(--ink-soft)]">
                        {match.winnerId
                          ? `Winner: ${match.winnerId === match.competitorA.id ? match.competitorA.name : match.competitorB.name}`
                          : match.status === "in_progress"
                            ? "Live now"
                            : "Pending"}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </aside>
    </div>
  );
}
