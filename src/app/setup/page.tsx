import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { SetupClient } from "@/components/setup-client";
import { getSessionSummary } from "@/lib/session-store";

export default async function SetupPage() {
  const summary = await getSessionSummary();

  if (!summary?.session) {
    redirect("/");
  }

  if (summary.tournament?.status === "active") {
    redirect("/tournament");
  }

  if (summary.tournament?.status === "completed") {
    redirect("/results");
  }

  return (
    <AppShell
      eyebrow="Tournament Setup"
      heading="Build your bracket"
      subheading="Pick an exact bracket size and enter every participant name for this session. Once the list is complete, generate the bracket and start the tournament."
    >
      <SetupClient />
    </AppShell>
  );
}
