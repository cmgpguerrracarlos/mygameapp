"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function EndSessionButton() {
  const router = useRouter();
  const [ending, setEnding] = useState(false);

  async function handleEndSession() {
    setEnding(true);

    await fetch("/api/session/end", {
      method: "POST",
    });

    router.push("/");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleEndSession}
      disabled={ending}
      className="rounded-full border border-[var(--line)] bg-white/80 px-4 py-2 text-sm font-semibold text-[var(--foreground)] shadow-sm hover:border-[var(--accent)] hover:text-[var(--accent)] disabled:cursor-wait disabled:opacity-70"
    >
      {ending ? "Ending..." : "End Session"}
    </button>
  );
}
