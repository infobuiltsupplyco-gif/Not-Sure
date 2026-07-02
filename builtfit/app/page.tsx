import Link from "next/link";
import {
  BadgeCheck,
  HeartHandshake,
  ScanBarcode,
  Scale,
  Sparkles,
  Unlock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const PILLARS = [
  {
    icon: BadgeCheck,
    title: "Verified food data only",
    body: "Every food in global search comes from USDA FoodData Central or Open Food Facts, with a visible source and confidence score. Your own entries stay yours — they never pollute anyone's search.",
  },
  {
    icon: Unlock,
    title: "Core features free forever",
    body: "Barcode scanning, macros, custom goals, charts, and CSV export are free — permanently, in writing, in the code. No trial timers, no locked buttons.",
  },
  {
    icon: Scale,
    title: "Honest exercise math",
    body: "Calorie burn uses conservative MET science and is shown as a range. We default to the low end and never quietly inflate your budget.",
  },
  {
    icon: HeartHandshake,
    title: "Wellbeing first",
    body: "Gentle Mode hides every calorie number. Streaks reward consistency, not deficits. No red alarms, no shaming — and a hard safety floor on goals.",
  },
];

export default function LandingPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col px-6">
      <header className="flex items-center justify-between py-6">
        <div className="flex items-center gap-2">
          <Sparkles className="size-6 text-primary" />
          <span className="text-xl font-bold tracking-tight">BuiltFit</span>
        </div>
        <nav className="flex items-center gap-2">
          <Link href="/login" className="hidden sm:inline-flex">
            <Button variant="ghost">Sign in</Button>
          </Link>
          <Link href="/signup">
            <Button>Get started free</Button>
          </Link>
        </nav>
      </header>

      <section className="flex flex-col items-center py-16 text-center sm:py-24">
        <Badge variant="verified" className="mb-6">
          <BadgeCheck className="size-3.5" /> 100% free at launch — no card, no trial
        </Badge>
        <h1 className="max-w-2xl text-4xl font-bold leading-tight tracking-tight sm:text-6xl">
          Track your nutrition.
          <br />
          <span className="text-primary">Keep your peace of mind.</span>
        </h1>
        <p className="mt-6 max-w-xl text-lg text-muted-foreground">
          BuiltFit is the tracker built on verified data, honest math, and a
          design that respects your wellbeing — not your anxiety.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href="/signup">
            <Button size="lg">Start tracking free</Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="outline">
              I already have an account
            </Button>
          </Link>
        </div>
        <p className="mt-4 flex items-center gap-1.5 text-sm text-muted-foreground">
          <ScanBarcode className="size-4" /> Barcode scanning included. Free forever.
        </p>
      </section>

      <section className="grid gap-4 pb-20 sm:grid-cols-2">
        {PILLARS.map((p) => (
          <div key={p.title} className="rounded-lg border bg-card p-6">
            <p.icon className="size-6 text-primary" />
            <h2 className="mt-3 text-lg font-semibold">{p.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.body}</p>
          </div>
        ))}
      </section>

      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        BuiltFit · part of the Built Supply Co family · your data is yours —
        export it anytime, delete it anytime.
      </footer>
    </main>
  );
}
