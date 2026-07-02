import type { Metadata } from "next";
import { RecipeBuilder } from "@/components/recipe-builder";
import { getSession } from "@/lib/data";

export const metadata: Metadata = { title: "New recipe" };

export default async function NewRecipePage() {
  await getSession();
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">New recipe</h1>
      <RecipeBuilder />
    </div>
  );
}
