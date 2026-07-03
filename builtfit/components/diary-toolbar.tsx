"use client";

import * as React from "react";
import Link from "next/link";
import { CopyPlus, Plus, ScanBarcode, Zap } from "lucide-react";
import { copyFromDate, quickAddEntry } from "@/lib/actions/diary";
import { addDays } from "@/lib/utils";
import type { Meal } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

export function DiaryToolbar({ date }: { date: string }) {
  const [pending, startTransition] = React.useTransition();
  const [message, setMessage] = React.useState<string | null>(null);
  const [quickOpen, setQuickOpen] = React.useState(false);

  const copyYesterday = () =>
    startTransition(async () => {
      const result = await copyFromDate({ fromDate: addDays(date, -1), toDate: date });
      setMessage(result.ok ? "Copied yesterday's diary." : result.error);
    });

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <Link href={`/foods/search?date=${date}`}>
          <Button size="sm">
            <Plus /> Add food
          </Button>
        </Link>
        <Link href={`/foods/scan?date=${date}`}>
          <Button size="sm" variant="outline">
            <ScanBarcode /> Scan
          </Button>
        </Link>
        <Button size="sm" variant="outline" onClick={() => setQuickOpen(true)}>
          <Zap /> Quick add
        </Button>
        <Button size="sm" variant="outline" disabled={pending} onClick={copyYesterday}>
          <CopyPlus /> Copy yesterday
        </Button>
      </div>
      {message ? <p className="text-xs text-muted-foreground">{message}</p> : null}
      <QuickAddDialog date={date} open={quickOpen} onOpenChange={setQuickOpen} />
    </div>
  );
}

function QuickAddDialog({
  date,
  open,
  onOpenChange,
}: {
  date: string;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);
  const [name, setName] = React.useState("");
  const [meal, setMeal] = React.useState<Meal>("snack");
  const [calories, setCalories] = React.useState("");
  const [protein, setProtein] = React.useState("");
  const [carbs, setCarbs] = React.useState("");
  const [fat, setFat] = React.useState("");

  const submit = () =>
    startTransition(async () => {
      setError(null);
      const result = await quickAddEntry({
        date,
        meal,
        name: name.trim() || "Quick add",
        calories: Number(calories) || 0,
        protein_g: Number(protein) || 0,
        carbs_g: Number(carbs) || 0,
        fat_g: Number(fat) || 0,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onOpenChange(false);
      setName("");
      setCalories("");
      setProtein("");
      setCarbs("");
      setFat("");
    });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTitle>Quick add</DialogTitle>
      <DialogDescription>
        For when you know the numbers but not the food. Saved as unverified.
      </DialogDescription>
      <div className="mt-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="qa-name">Name</Label>
            <Input
              id="qa-name"
              placeholder="e.g. Work lunch"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="qa-meal">Meal</Label>
            <Select id="qa-meal" value={meal} onChange={(e) => setMeal(e.target.value as Meal)}>
              <option value="breakfast">Breakfast</option>
              <option value="lunch">Lunch</option>
              <option value="dinner">Dinner</option>
              <option value="snack">Snack</option>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-2">
          <div className="space-y-1.5">
            <Label htmlFor="qa-cal">kcal</Label>
            <Input
              id="qa-cal"
              type="number"
              min={0}
              value={calories}
              onChange={(e) => setCalories(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="qa-p">Protein</Label>
            <Input
              id="qa-p"
              type="number"
              min={0}
              value={protein}
              onChange={(e) => setProtein(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="qa-c">Carbs</Label>
            <Input
              id="qa-c"
              type="number"
              min={0}
              value={carbs}
              onChange={(e) => setCarbs(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="qa-f">Fat</Label>
            <Input
              id="qa-f"
              type="number"
              min={0}
              value={fat}
              onChange={(e) => setFat(e.target.value)}
            />
          </div>
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <Button className="w-full" disabled={pending} onClick={submit}>
          {pending ? "Adding…" : "Add to diary"}
        </Button>
      </div>
    </Dialog>
  );
}
