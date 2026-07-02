import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { RecipeList, type RecipeListItem } from "@/components/recipe-list";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getSession } from "@/lib/data";
import type { Nutrients } from "@/lib/types";
import { todayISO } from "@/lib/utils";

export const metadata: Metadata = { title: "Recipes" };

export default async function RecipesPage() {
  const { supabase, userId, profile } = await getSession();
  const { data } = await supabase
    .from("recipes")
    .select("id, name, servings_count, per_serving, serving_grams, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  const recipes: RecipeListItem[] = (data ?? []).map((r) => ({
    id: r.id as string,
    name: r.name as string,
    servingsCount: Number(r.servings_count),
    perServing: r.per_serving as Nutrients,
    servingGrams: Number(r.serving_grams),
  }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Recipes & meals</h1>
        <Link href="/recipes/new">
          <Button>
            <Plus /> New recipe
          </Button>
        </Link>
      </div>
      {recipes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <p className="text-sm text-muted-foreground">
              Build a recipe once — soups, smoothies, meal-prep batches — and log a
              serving with one tap forever after.
            </p>
            <Link href="/recipes/new">
              <Button size="sm">Create your first recipe</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <RecipeList recipes={recipes} today={todayISO(profile.timezone)} />
      )}
    </div>
  );
}
