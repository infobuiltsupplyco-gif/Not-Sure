"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Trash2, UtensilsCrossed } from "lucide-react";
import { addDiaryEntry } from "@/lib/actions/diary";
import { deleteRecipe } from "@/lib/actions/recipes";
import type { FoodItem, Nutrients } from "@/lib/types";
import { CalorieValue } from "@/components/gentle";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export interface RecipeListItem {
  id: string;
  name: string;
  servingsCount: number;
  perServing: Nutrients;
  servingGrams: number;
}

function recipeToFoodItem(r: RecipeListItem): FoodItem {
  const grams = r.servingGrams > 0 ? r.servingGrams : 100;
  const factor = 100 / grams;
  const per100g = { ...r.perServing };
  for (const key of Object.keys(per100g) as (keyof Nutrients)[]) {
    per100g[key] = Math.round(r.perServing[key] * factor * 10) / 10;
  }
  return {
    id: `recipe:${r.id}`,
    source: "recipe",
    sourceId: r.id,
    name: r.name,
    brand: "My recipe",
    barcode: null,
    per100g,
    servings: [
      { label: "1 serving", grams },
      { label: "100 g", grams: 100 },
    ],
    verified: false,
    confidence: 0.5,
    wholeFood: false,
  };
}

export function RecipeList({
  recipes,
  today,
}: {
  recipes: RecipeListItem[];
  today: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [message, setMessage] = React.useState<string | null>(null);

  const logServing = (r: RecipeListItem) =>
    startTransition(async () => {
      const food = recipeToFoodItem(r);
      const result = await addDiaryEntry({
        date: today,
        meal: "dinner",
        food,
        quantity: 1,
        servingLabel: "1 serving",
        servingGrams: food.servings[0].grams,
      });
      setMessage(result.ok ? `Logged 1 serving of ${r.name} to dinner.` : result.error);
      if (result.ok) router.refresh();
    });

  return (
    <div className="space-y-2">
      {message ? <p className="text-xs text-muted-foreground">{message}</p> : null}
      {recipes.map((r) => (
        <Card key={r.id}>
          <CardContent className="flex items-center gap-3 pt-4 sm:pt-5">
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{r.name}</p>
              <p className="text-xs text-muted-foreground">
                {r.servingsCount} {r.servingsCount === 1 ? "serving" : "servings"} ·{" "}
                <CalorieValue value={r.perServing.calories} gentleText="balanced recipe" />{" "}
                / serving · {Math.round(r.perServing.protein_g)} g protein
              </p>
            </div>
            <Button size="sm" disabled={pending} onClick={() => logServing(r)}>
              <UtensilsCrossed /> Log serving
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-muted-foreground"
              aria-label={`Delete ${r.name}`}
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  await deleteRecipe(r.id);
                  router.refresh();
                })
              }
            >
              <Trash2 className="size-4" />
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
