import Link from "next/link";
import { ReactNode } from "react";
import { EndSessionButton } from "@/components/end-session-button";

type AppShellProps = {
  children: ReactNode;
  heading: string;
  subheading: string;
  eyebrow: string;
  showSessionControl?: boolean;
};

export function AppShell({
  children,
  heading,
  subheading,
  eyebrow,
  showSessionControl = true,
}: AppShellProps) {
  return (
    <main className="min-h-screen px-4 py-5 sm:px-6">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="glass-panel rounded-[2rem] px-5 py-5 sm:px-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="max-w-2xl">
              <Link
                href="/"
                className="inline-flex rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-[var(--accent-strong)]"
              >
                {eyebrow}
              </Link>
              <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">{heading}</h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--ink-soft)] sm:text-base">
                {subheading}
              </p>
            </div>
            {showSessionControl ? <EndSessionButton /> : null}
          </div>
        </header>
        {children}
      </div>
    </main>
  );
}
