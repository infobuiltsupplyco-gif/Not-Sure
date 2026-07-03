"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Search, Trash2 } from "lucide-react";
import { createRecipe } from "@/lib/actions/recipes";
import { scaleNutrients, sumNutrients, type FoodItem } from "@/lib/types";
import { CalorieValue } from "@/components/gentle";
import { SourceBadge } from "@/components/food-search";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Ingredient {
  food: FoodItem;
  quantity: number;
  servingIdx: number;
}

export function RecipeBuilder() {
  const router = useRouter();
  const [name, setName] = React.useState("");
  const [servingsCount, setServingsCount] = React.useState("4");
  const [ingredients, setIngredients] = React.useState<Ingredient[]>([]);
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<FoodItem[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/foods/search?q=${encodeURIComponent(q)}`);
        if (res.ok) {
          const data = (await res.json()) as { verified: FoodItem[]; personal: FoodItem[] };
          setResults([...data.personal, ...data.verified].slice(0, 8));
        }
      } finally {
        setLoading(false);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [query]);

  const totals = sumNutrients(
    ingredients.map((ing) =>
      scaleNutrients(
        ing.food.per100g,
        ing.quantity * (ing.food.servings[ing.servingIdx]?.grams ?? 100)
      )
    )
  );
  const servings = Math.max(1, Number(servingsCount) || 1);

  const save = () =>
    startTransition(async () => {
      setError(null);
      const result = await createRecipe({
        name: name.trim(),
        servingsCount: servings,
        ingredients: ingredients.map((ing) => {
          const serving = ing.food.servings[ing.servingIdx] ?? ing.food.servings[0];
          return {
            foodId: ing.food.id,
            foodName: ing.food.name,
            quantity: ing.quantity,
            servingLabel: serving.label,
            servingGrams: serving.grams,
            per100g: ing.food.per100g,
          };
        }),
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push("/recipes");
    });

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="grid gap-3 pt-4 sm:grid-cols-3 sm:pt-5">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="rc-name">Recipe name *</Label>
            <Input
              id="rc-name"
              placeholder="e.g. Sunday chili"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="rc-servings">Servings it makes</Label>
            <Input
              id="rc-servings"
              type="number"
              min={1}
              value={servingsCount}
              onChange={(e) => setServingsCount(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ingredients</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search foods to add…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search ingredients"
            />
          </div>
          {loading ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Searching…
            </p>
          ) : null}
          {results.length > 0 ? (
            <ul className="space-y-1.5">
              {results.map((food) => (
                <li key={food.id}>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-2 rounded-md border p-2 text-left text-sm hover:border-primary/50"
                    onClick={() => {
                      setIngredients((prev) => [...prev, { food, quantity: 1, servingIdx: 0 }]);
                      setQuery("");
                      setResults([]);
                    }}
                  >
                    <span className="min-w-0 flex-1 truncate">{food.name}</span>
                    <SourceBadge food={food} />
                  </button>
                </li>
              ))}
            </ul>
          ) : null}

          {ingredients.length === 0 ? (
            <p className="py-2 text-sm text-muted-foreground">
              No ingredients yet — search above to add some.
            </p>
          ) : (
            <ul className="divide-y">
              {ingredients.map((ing, i) => {
                const serving = ing.food.servings[ing.servingIdx] ?? ing.food.servings[0];
                return (
                  <li key={`${ing.food.id}-${i}`} className="flex items-center gap-2 py-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm">{ing.food.name}</p>
                      <p className="text-xs text-muted-foreground">{serving.label}</p>
                    </div>
                    <Input
                      type="number"
                      min={0.1}
                      step={0.25}
                      className="h-8 w-20"
                      value={ing.quantity}
                      aria-label={`Quantity of ${ing.food.name}`}
                      onChange={(e) =>
                        setIngredients((prev) =>
                          prev.map((p, j) =>
                            j === i ? { ...p, quantity: Number(e.target.value) || 0.1 } : p
                          )
                        )
                      }
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-muted-foreground"
                      aria-label={`Remove ${ing.food.name}`}
                      onClick={() =>
                        setIngredients((prev) => prev.filter((_, j) => j !== i))
                      }
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      {ingredients.length > 0 ? (
        <Card>
          <CardContent className="pt-4 sm:pt-5">
            <p className="text-sm font-medium">Per serving ({servings} total)</p>
            <div className="mt-2 grid grid-cols-4 gap-2 text-center text-sm">
              <div>
                <p className="font-semibold">
                  <CalorieValue value={totals.calories / servings} suffix="" gentleText="—" />
                </p>
                <p className="text-xs text-muted-foreground">kcal</p>
              </div>
              <div>
                <p className="font-semibold">{Math.round(totals.protein_g / servings)}</p>
                <p className="text-xs text-muted-foreground">protein g</p>
              </div>
              <div>
                <p className="font-semibold">{Math.round(totals.carbs_g / servings)}</p>
                <p className="text-xs text-muted-foreground">carbs g</p>
              </div>
              <div>
                <p className="font-semibold">{Math.round(totals.fat_g / servings)}</p>
                <p className="text-xs text-muted-foreground">fat g</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button
        className="w-full"
        disabled={pending || !name.trim() || ingredients.length === 0}
        onClick={save}
      >
        {pending ? "Saving…" : "Save recipe"}
      </Button>
    </div>
  );
}
