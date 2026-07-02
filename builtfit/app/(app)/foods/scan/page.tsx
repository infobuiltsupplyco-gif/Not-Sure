import type { Metadata } from "next";
import { BarcodeScanner } from "@/components/barcode-scanner";
import { getSession } from "@/lib/data";
import type { Meal } from "@/lib/types";
import { todayISO } from "@/lib/utils";

export const metadata: Metadata = { title: "Scan barcode" };

const MEALS: Meal[] = ["breakfast", "lunch", "dinner", "snack"];

export default async function ScanPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; meal?: string }>;
}) {
  const { profile } = await getSession();
  const params = await searchParams;
  const date = /^\d{4}-\d{2}-\d{2}$/.test(params.date ?? "")
    ? params.date!
    : todayISO(profile.timezone);
  const meal = MEALS.includes(params.meal as Meal) ? (params.meal as Meal) : "snack";

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Scan a barcode</h1>
        <p className="text-sm text-muted-foreground">
          Free forever — scanning is a core feature, not a perk.
        </p>
      </div>
      <BarcodeScanner date={date} meal={meal} />
    </div>
  );
}
