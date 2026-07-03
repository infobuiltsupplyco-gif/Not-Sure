"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BadgeCheck, Check, Loader2, Plus, Search } from "lucide-react";
import { addDiaryEntry } from "@/lib/actions/diary";
import type { FoodItem, Meal, Nutrients } from "@/lib/types";
import { scaleNutrients } from "@/lib/types";
import { CalorieValue } from "@/components/gentle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";

interface SearchResults {
  verified: FoodItem[];
  personal: FoodItem[];
  recipes: FoodItem[];
}

export interface RecentFood {
  food_id: string;
  food_name: string;
  food_brand: string | null;
  verified: boolean;
  serving_label: string;
  serving_grams: number;
  nutrition: Nutrients;
  whole_food: boolean;
  count: number;
}

export function FoodSearch({
  date,
  meal,
  recents,
}: {
  date: string;
  meal: Meal;
  recents: RecentFood[];
}) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<SearchResults | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [searchError, setSearchError] = React.useState<string | null>(null);
  const [selected, setSelected] = React.useState<FoodItem | null>(null);
  const [multiSelect, setMultiSelect] = React.useState(false);
  const [basket, setBasket] = React.useState<FoodItem[]>([]);
  const [adding, setAdding] = React.useState(false);
  const abortRef = React.useRef<AbortController | null>(null);

  // Debounced merged-source search.
  React.useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setSearchError(null);
    const timer = setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      try {
        const res = await fetch(`/api/foods/search?q=${encodeURIComponent(q)}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error("Search failed");
        setResults((await res.json()) as SearchResults);
      } catch (err) {
        if (!(err instanceof DOMException && err.name === "AbortError")) {
          setSearchError("Search hit a snag — check your connection and try again.");
        }
      } finally {
        setLoading(false);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [query]);

  const toggleBasket = (food: FoodItem) => {
    setBasket((prev) =>
      prev.some((f) => f.id === food.id)
        ? prev.filter((f) => f.id !== food.id)
        : [...prev, food]
    );
  };

  const pick = (food: FoodItem) => {
    if (multiSelect) toggleBasket(food);
    else setSelected(food);
  };

  const addBasket = async () => {
    setAdding(true);
    for (const food of basket) {
      const serving = food.servings[0];
      await addDiaryEntry({
        date,
        meal,
        food,
        quantity: 1,
        servingLabel: serving.label,
        servingGrams: serving.grams,
      });
    }
    router.push(`/diary?date=${date}`);
  };

  const all = results
    ? [...results.recipes, ...results.personal, ...results.verified]
    : null;

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          autoFocus
          className="pl-9"
          placeholder="Search verified foods…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search foods"
        />
      </div>

      <div className="flex items-center justify-between text-sm">
        <label className="flex items-center gap-2 text-muted-foreground">
          <Switch
            checked={multiSelect}
            onCheckedChange={(v) => {
              setMultiSelect(v);
              if (!v) setBasket([]);
            }}
            aria-label="Multi-select"
          />
          Multi-select
        </label>
        <Link
          href={`/foods/new?date=${date}&meal=${meal}`}
          className="font-medium text-primary hover:underline"
        >
          + Create personal food
        </Link>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : null}

      {searchError ? <p className="text-sm text-destructive">{searchError}</p> : null}

      {!loading && all && all.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            No verified match for “{query.trim()}”. Try a simpler term (brand names
            work too), scan the barcode, or create it as a personal food.
          </CardContent>
        </Card>
      ) : null}

      {!loading && all && all.length > 0 ? (
        <ul className="space-y-2">
          {all.map((food) => (
            <FoodRow
              key={food.id}
              food={food}
              onClick={() => pick(food)}
              selected={basket.some((f) => f.id === food.id)}
              multiSelect={multiSelect}
            />
          ))}
        </ul>
      ) : null}

      {!query.trim() && recents.length > 0 ? (
        <section>
          <h2 className="mb-2 text-sm font-semibold text-muted-foreground">
            Recent & frequent
          </h2>
          <ul className="space-y-2">
            {recents.map((r) => {
              const food = recentToFoodItem(r);
              return (
                <FoodRow
                  key={r.food_id}
                  food={food}
                  onClick={() => pick(food)}
                  selected={basket.some((f) => f.id === food.id)}
                  multiSelect={multiSelect}
                />
              );
            })}
          </ul>
        </section>
      ) : null}

      {!query.trim() && recents.length === 0 && !results ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Search any food — results come from USDA and Open Food Facts, with a
            verified badge and data source on every match.
          </CardContent>
        </Card>
      ) : null}

      {multiSelect && basket.length > 0 ? (
        <div className="fixed inset-x-0 bottom-16 z-40 mx-auto w-full max-w-3xl px-4 md:bottom-4 md:pl-60">
          <Button className="w-full shadow-lg" disabled={adding} onClick={addBasket}>
            {adding ? <Loader2 className="animate-spin" /> : <Plus />}
            Add {basket.length} {basket.length === 1 ? "item" : "items"} to {meal}
          </Button>
        </div>
      ) : null}

      {selected ? (
        <ServingDialog
          food={selected}
          date={date}
          meal={meal}
          onClose={() => setSelected(null)}
          onAdded={() => router.push(`/diary?date=${date}`)}
        />
      ) : null}
    </div>
  );
}

function recentToFoodItem(r: RecentFood): FoodItem {
  // Reconstruct per-100g from the logged snapshot for consistent scaling.
  const grams = r.serving_grams > 0 ? r.serving_grams : 100;
  const factor = 100 / grams;
  const per100g = { ...r.nutrition };
  for (const key of Object.keys(per100g) as (keyof Nutrients)[]) {
    per100g[key] = Math.round(r.nutrition[key] * factor * 10) / 10;
  }
  const [source = "usda", sourceId = r.food_id] = r.food_id.split(":");
  return {
    id: r.food_id,
    source: source as FoodItem["source"],
    sourceId,
    name: r.food_name,
    brand: r.food_brand,
    barcode: null,
    per100g,
    servings: [{ label: r.serving_label, grams }, { label: "100 g", grams: 100 }],
    verified: r.verified,
    confidence: r.verified ? 0.9 : 0.3,
    wholeFood: r.whole_food,
  };
}

export function FoodRow({
  food,
  onClick,
  selected = false,
  multiSelect = false,
}: {
  food: FoodItem;
  onClick: () => void;
  selected?: boolean;
  multiSelect?: boolean;
}) {
  const serving = food.servings[0];
  const perServing = scaleNutrients(food.per100g, serving.grams);
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className="flex w-full items-center gap-3 rounded-lg border bg-card p-3 text-left transition-colors hover:border-primary/50"
      >
        {multiSelect ? (
          <span
            className={`flex size-5 shrink-0 items-center justify-center rounded border ${
              selected ? "border-primary bg-primary text-primary-foreground" : ""
            }`}
            aria-hidden="true"
          >
            {selected ? <Check className="size-3.5" /> : null}
          </span>
        ) : null}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{food.name}</p>
          <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
            {food.brand ? <span className="truncate">{food.brand}</span> : null}
            <SourceBadge food={food} />
          </p>
        </div>
        <div className="text-right text-sm">
          <p className="font-medium">
            <CalorieValue value={perServing.calories} gentleText="" />
          </p>
          <p className="text-xs text-muted-foreground">{serving.label}</p>
        </div>
      </button>
    </li>
  );
}

export function SourceBadge({ food }: { food: FoodItem }) {
  if (food.source === "personal") {
    return <Badge variant="unverified">Personal entry — unverified</Badge>;
  }
  if (food.source === "recipe") {
    return <Badge variant="secondary">My recipe</Badge>;
  }
  const sourceName = food.source === "usda" ? "USDA" : "Open Food Facts";
  return (
    <>
      {food.verified ? (
        <Badge variant="verified">
          <BadgeCheck className="size-3" /> Verified
        </Badge>
      ) : (
        <Badge variant="unverified">Unverified</Badge>
      )}
      <span>
        {sourceName} · {Math.round(food.confidence * 100)}% confidence
      </span>
    </>
  );
}

export function ServingDialog({
  food,
  date,
  meal: initialMeal,
  onClose,
  onAdded,
}: {
  food: FoodItem;
  date: string;
  meal: Meal;
  onClose: () => void;
  onAdded: () => void;
}) {
  const [quantity, setQuantity] = React.useState("1");
  const [servingIdx, setServingIdx] = React.useState(0);
  const [meal, setMeal] = React.useState<Meal>(initialMeal);
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);

  const serving = food.servings[servingIdx] ?? food.servings[0];
  const qty = Math.max(0, Number(quantity) || 0);
  const nutrition = scaleNutrients(food.per100g, qty * serving.grams);

  const add = () =>
    startTransition(async () => {
      setError(null);
      if (qty <= 0) {
        setError("Enter a quantity above zero");
        return;
      }
      const result = await addDiaryEntry({
        date,
        meal,
        food,
        quantity: qty,
        servingLabel: serving.label,
        servingGrams: serving.grams,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onAdded();
    });

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogTitle>{food.name}</DialogTitle>
      <DialogDescription className="flex flex-wrap items-center gap-1.5">
        {food.brand ? `${food.brand} · ` : ""}
        <SourceBadge food={food} />
      </DialogDescription>
      <div className="mt-4 space-y-3">
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="sv-qty">Quantity</Label>
            <Input
              id="sv-qty"
              type="number"
              min={0.1}
              step={0.25}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label htmlFor="sv-serving">Serving</Label>
            <Select
              id="sv-serving"
              value={servingIdx}
              onChange={(e) => setServingIdx(Number(e.target.value))}
            >
              {food.servings.map((s, i) => (
                <option key={`${s.label}-${i}`} value={i}>
                  {s.label}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="sv-meal">Meal</Label>
          <Select id="sv-meal" value={meal} onChange={(e) => setMeal(e.target.value as Meal)}>
            <option value="breakfast">Breakfast</option>
            <option value="lunch">Lunch</option>
            <option value="dinner">Dinner</option>
            <option value="snack">Snack</option>
          </Select>
        </div>
        <div className="grid grid-cols-4 gap-2 rounded-md bg-muted/50 p-3 text-center text-sm">
          <div>
            <p className="font-semibold">
              <CalorieValue value={nutrition.calories} suffix="" gentleText="—" />
            </p>
            <p className="text-xs text-muted-foreground">kcal</p>
          </div>
          <div>
            <p className="font-semibold">{nutrition.protein_g}</p>
            <p className="text-xs text-muted-foreground">protein</p>
          </div>
          <div>
            <p className="font-semibold">{nutrition.carbs_g}</p>
            <p className="text-xs text-muted-foreground">carbs</p>
          </div>
          <div>
            <p className="font-semibold">{nutrition.fat_g}</p>
            <p className="text-xs text-muted-foreground">fat</p>
          </div>
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <Button className="w-full" disabled={pending} onClick={add}>
          {pending ? "Adding…" : `Add to ${meal}`}
        </Button>
      </div>
    </Dialog>
  );
}
