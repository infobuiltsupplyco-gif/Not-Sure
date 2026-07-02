"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { createPersonalFood } from "@/lib/actions/recipes";
import { EMPTY_NUTRIENTS, type Nutrients } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const FIELDS: { key: keyof Nutrients; label: string; required?: boolean }[] = [
  { key: "calories", label: "Calories (kcal)", required: true },
  { key: "protein_g", label: "Protein (g)", required: true },
  { key: "carbs_g", label: "Carbs (g)", required: true },
  { key: "fat_g", label: "Fat (g)", required: true },
  { key: "fiber_g", label: "Fiber (g)" },
  { key: "sugar_g", label: "Sugar (g)" },
  { key: "saturated_fat_g", label: "Saturated fat (g)" },
  { key: "sodium_mg", label: "Sodium (mg)" },
];

export function PersonalFoodForm({ date }: { date: string }) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);
  const [name, setName] = React.useState("");
  const [brand, setBrand] = React.useState("");
  const [servingLabel, setServingLabel] = React.useState("1 serving");
  const [servingGrams, setServingGrams] = React.useState("100");
  const [values, setValues] = React.useState<Record<string, string>>({});

  const submit = () =>
    startTransition(async () => {
      setError(null);
      const perServing: Nutrients = { ...EMPTY_NUTRIENTS };
      for (const f of FIELDS) {
        perServing[f.key] = Number(values[f.key]) || 0;
      }
      const result = await createPersonalFood({
        name: name.trim(),
        brand: brand.trim() || undefined,
        servingLabel: servingLabel.trim() || "1 serving",
        servingGrams: Number(servingGrams) || 100,
        perServing,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push(`/foods/search?date=${date}`);
    });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          New personal food
          <Badge variant="unverified">Personal entry — unverified</Badge>
        </CardTitle>
        <CardDescription>
          Private to your account. Personal foods never appear in anyone else&apos;s
          search and never mix into the verified database.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="pf-name">Name *</Label>
            <Input id="pf-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pf-brand">Brand (optional)</Label>
            <Input id="pf-brand" value={brand} onChange={(e) => setBrand(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pf-serving">Serving label</Label>
            <Input
              id="pf-serving"
              value={servingLabel}
              onChange={(e) => setServingLabel(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pf-grams">Serving weight (g)</Label>
            <Input
              id="pf-grams"
              type="number"
              min={1}
              value={servingGrams}
              onChange={(e) => setServingGrams(e.target.value)}
            />
          </div>
        </div>
        <div>
          <p className="mb-2 text-sm font-medium">Nutrition per serving</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {FIELDS.map((f) => (
              <div key={f.key} className="space-y-1.5">
                <Label htmlFor={`pf-${f.key}`} className="text-xs">
                  {f.label}
                  {f.required ? " *" : ""}
                </Label>
                <Input
                  id={`pf-${f.key}`}
                  type="number"
                  min={0}
                  step="any"
                  value={values[f.key] ?? ""}
                  onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                />
              </div>
            ))}
          </div>
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <Button
          className="w-full"
          disabled={pending || !name.trim() || !(Number(servingGrams) > 0)}
          onClick={submit}
        >
          {pending ? "Saving…" : "Save personal food"}
        </Button>
      </CardContent>
    </Card>
  );
}
