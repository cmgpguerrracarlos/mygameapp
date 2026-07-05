import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { getSessionSummary } from "@/lib/session-store";

export default async function HomePage() {
  const summary = await getSessionSummary();

  if (summary?.session && summary.session.status === "active") {
    redirect(summary.tournament ? (summary.tournament.status === "completed" ? "/results" : "/tournament") : "/setup");
  }

  return (
    <AppShell
      eyebrow="Quick Tournament"
      heading="Launch a private bracket in seconds."
      subheading="Create a temporary session, add each participant by name, and watch the simulator resolve the tournament one match at a time."
      showSessionControl={false}
    >
      <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="glass-panel-strong rounded-[2rem] p-6 sm:p-8">
          <p className="max-w-xl text-sm leading-7 text-[var(--ink-soft)] sm:text-base">
            Bracket Blitz keeps everything session-based and lightweight. Sessions expire automatically, participants are entered by name only, and one tap advances each match until the podium is ready.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <form action="/api/session/start" method="post">
              <button
                type="submit"
                className="w-full rounded-full bg-[var(--accent)] px-6 py-4 text-sm font-semibold text-white shadow-lg shadow-orange-300/50 hover:bg-[var(--accent-strong)]"
              >
                Start Session
              </button>
            </form>
            <Link
              href="/setup"
              className="rounded-full border border-[var(--line)] bg-white/80 px-6 py-4 text-sm font-semibold text-[var(--foreground)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
            >
              Explore setup
            </Link>
          </div>
        </div>

        <div className="grid gap-4">
          {[
            "2 to 32 competitors, exact elimination brackets only.",
            "Name-only setup keeps each session fast and simple.",
            "Ratings shift after every match so upsets matter.",
            "Third-place playoff included for a full top-three podium.",
          ].map((line) => (
            <div key={line} className="glass-panel rounded-[1.6rem] p-5 text-sm leading-6 text-[var(--ink-soft)]">
              {line}
            </div>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
