"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, ScanBarcode } from "lucide-react";
import type { FoodItem, Meal } from "@/lib/types";
import { ServingDialog } from "@/components/food-search";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const REGION_ID = "bf-barcode-region";

export function BarcodeScanner({ date, meal }: { date: string; meal: Meal }) {
  const router = useRouter();
  const [status, setStatus] = React.useState<"idle" | "starting" | "scanning" | "looking-up" | "error">("idle");
  const [error, setError] = React.useState<string | null>(null);
  const [food, setFood] = React.useState<FoodItem | null>(null);
  const [manualCode, setManualCode] = React.useState("");
  const scannerRef = React.useRef<{ stop: () => Promise<void>; clear: () => void } | null>(null);
  const lookupBusy = React.useRef(false);

  const lookup = React.useCallback(async (code: string) => {
    if (lookupBusy.current) return;
    lookupBusy.current = true;
    setStatus("looking-up");
    setError(null);
    try {
      const res = await fetch(`/api/foods/barcode/${encodeURIComponent(code)}`);
      const data = (await res.json()) as { food?: FoodItem; error?: string };
      if (!res.ok || !data.food) {
        setError(data.error ?? "No match found for that barcode.");
        setStatus("scanning");
        return;
      }
      setFood(data.food);
    } catch {
      setError("Lookup failed — check your connection.");
      setStatus("scanning");
    } finally {
      lookupBusy.current = false;
    }
  }, []);

  const start = React.useCallback(async () => {
    setStatus("starting");
    setError(null);
    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const scanner = new Html5Qrcode(REGION_ID);
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 260, height: 160 } },
        (decoded) => {
          if (/^[0-9]{6,14}$/.test(decoded)) {
            void scanner.pause(true);
            void lookup(decoded);
          }
        },
        () => {
          // per-frame decode misses are normal; ignore
        }
      );
      setStatus("scanning");
    } catch (err) {
      setStatus("error");
      setError(
        err instanceof Error && err.message.includes("Permission")
          ? "Camera permission was denied. You can type the barcode below instead."
          : "Couldn't start the camera on this device. You can type the barcode below instead."
      );
    }
  }, [lookup]);

  React.useEffect(() => {
    return () => {
      scannerRef.current?.stop().catch(() => undefined);
    };
  }, []);

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-4 sm:pt-5">
          <div
            id={REGION_ID}
            className="mx-auto min-h-40 w-full max-w-sm overflow-hidden rounded-md bg-black/80"
          />
          <div className="mt-4 flex flex-col items-center gap-2">
            {status === "idle" || status === "error" ? (
              <Button onClick={start}>
                <ScanBarcode /> Start camera
              </Button>
            ) : null}
            {status === "starting" ? (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" /> Starting camera…
              </p>
            ) : null}
            {status === "scanning" ? (
              <p className="text-sm text-muted-foreground">
                Point the camera at a product barcode.
              </p>
            ) : null}
            {status === "looking-up" ? (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" /> Looking up product…
              </p>
            ) : null}
            {error ? <p className="text-center text-sm text-destructive">{error}</p> : null}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3 pt-4 sm:pt-5">
          <Label htmlFor="manual-code">Or type the barcode</Label>
          <div className="flex gap-2">
            <Input
              id="manual-code"
              inputMode="numeric"
              placeholder="e.g. 0123456789012"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value.replace(/\D/g, ""))}
            />
            <Button
              variant="secondary"
              disabled={!/^[0-9]{6,14}$/.test(manualCode)}
              onClick={() => lookup(manualCode)}
            >
              Look up
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            No match?{" "}
            <Link href={`/foods/new?date=${date}&meal=${meal}`} className="text-primary hover:underline">
              Create it as a personal food
            </Link>{" "}
            — it stays private to your account.
          </p>
        </CardContent>
      </Card>

      {food ? (
        <ServingDialog
          food={food}
          date={date}
          meal={meal}
          onClose={() => {
            setFood(null);
            setStatus("idle");
          }}
          onAdded={() => router.push(`/diary?date=${date}`)}
        />
      ) : null}
    </div>
  );
}
