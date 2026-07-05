import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { TournamentClient } from "@/components/tournament-client";
import { getSessionSummary } from "@/lib/session-store";

export default async function TournamentPage() {
  const summary = await getSessionSummary();

  if (!summary?.session) {
    redirect("/");
  }

  if (!summary.tournament) {
    redirect("/setup");
  }

  if (summary.tournament.status === "completed") {
    redirect("/results");
  }

  return (
    <AppShell
      eyebrow="Live Simulation"
      heading="Advance one match at a time"
      subheading="Each tap reveals the next beat of the current duel. Ratings shape the odds, but every bracket still has room for chaos."
    >
      <TournamentClient initialSummary={summary} />
    </AppShell>
  );
}
