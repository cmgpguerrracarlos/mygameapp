import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { ResultsClient } from "@/components/results-client";
import { getSessionSummary } from "@/lib/session-store";

export default async function ResultsPage() {
  const summary = await getSessionSummary();

  if (!summary?.session) {
    redirect("/");
  }

  if (!summary.tournament) {
    redirect("/setup");
  }

  if (summary.tournament.status !== "completed") {
    redirect("/tournament");
  }

  return (
    <AppShell
      eyebrow="Final Podium"
      heading="Results locked in"
      subheading="The champion, runner-up, and third-place finisher stay available until the session ends or expires."
    >
      <ResultsClient summary={summary} />
    </AppShell>
  );
}
