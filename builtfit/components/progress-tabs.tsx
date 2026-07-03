"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Camera, Download, Trash2 } from "lucide-react";
import { logMeasurement, logWeight, savePhotoRecord, deleteProgressPhoto } from "@/lib/actions/progress";
import { createClient } from "@/lib/supabase/client";
import type { MeasurementLogRow, ProgressPhotoRow, Units, WeightLogRow } from "@/lib/types";
import { kgToLb, lbToKg, round, todayISO } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const SITE_LABELS: Record<string, string> = {
  waist: "Waist",
  hips: "Hips",
  chest: "Chest",
  left_arm: "Left arm",
  right_arm: "Right arm",
  left_thigh: "Left thigh",
  right_thigh: "Right thigh",
  neck: "Neck",
};

interface PhotoWithUrl extends ProgressPhotoRow {
  url: string | null;
}

export function ProgressTabs({
  weights,
  measurements,
  photos,
  units,
}: {
  weights: WeightLogRow[];
  measurements: MeasurementLogRow[];
  photos: PhotoWithUrl[];
  units: Units;
}) {
  return (
    <Tabs defaultValue="weight">
      <TabsList className="w-full">
        <TabsTrigger value="weight">Weight</TabsTrigger>
        <TabsTrigger value="measurements">Measurements</TabsTrigger>
        <TabsTrigger value="photos">Photos</TabsTrigger>
      </TabsList>
      <TabsContent value="weight" className="space-y-4">
        <WeightSection weights={weights} units={units} />
      </TabsContent>
      <TabsContent value="measurements" className="space-y-4">
        <MeasurementSection measurements={measurements} />
      </TabsContent>
      <TabsContent value="photos" className="space-y-4">
        <PhotoSection photos={photos} />
      </TabsContent>
    </Tabs>
  );
}

/* -------------------------- Weight -------------------------- */

function smooth(weights: WeightLogRow[]): { date: string; daily: number | null; trend: number }[] {
  return weights.map((w, i) => {
    const window = weights.slice(Math.max(0, i - 6), i + 1);
    const trend = window.reduce((s, x) => s + Number(x.weight_kg), 0) / window.length;
    return {
      date: w.date,
      daily: Number(w.weight_kg),
      trend: Math.round(trend * 100) / 100,
    };
  });
}

function WeightSection({ weights, units }: { weights: WeightLogRow[]; units: Units }) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);
  const [value, setValue] = React.useState("");

  const toDisplay = (kg: number) => (units === "imperial" ? round(kgToLb(kg), 1) : kg);
  const unitLabel = units === "imperial" ? "lb" : "kg";
  const data = smooth(weights).map((d) => ({
    ...d,
    daily: d.daily === null ? null : toDisplay(d.daily),
    trend: toDisplay(d.trend),
  }));

  const submit = () =>
    startTransition(async () => {
      setError(null);
      const num = Number(value);
      if (!Number.isFinite(num) || num <= 0) {
        setError("Enter your weight first");
        return;
      }
      const kg = units === "imperial" ? round(lbToKg(num), 1) : num;
      const result = await logWeight({ date: todayISO(), weightKg: kg });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setValue("");
      router.refresh();
    });

  return (
    <>
      <Card>
        <CardContent className="flex items-end gap-2 pt-4 sm:pt-5">
          <div className="flex-1 space-y-1.5">
            <Label htmlFor="wt-value">Today&apos;s weight ({unitLabel})</Label>
            <Input
              id="wt-value"
              type="number"
              step={0.1}
              min={1}
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
          </div>
          <Button disabled={pending} onClick={submit}>
            {pending ? "Saving…" : "Log"}
          </Button>
        </CardContent>
        {error ? (
          <CardContent className="pt-0 text-sm text-destructive">{error}</CardContent>
        ) : null}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Trend</CardTitle>
          <CardDescription>
            The bold line is your 7-day average — the number worth watching. Daily
            dots bounce with water and salt; the trend doesn&apos;t lie.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data.length < 2 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Log weight on a couple of days and your trend appears here.
            </p>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                  <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                    tickFormatter={(d: string) => d.slice(5)}
                  />
                  <YAxis
                    domain={["dataMin - 1", "dataMax + 1"]}
                    tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      color: "var(--foreground)",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="daily"
                    name={`Daily (${unitLabel})`}
                    stroke="var(--muted-foreground)"
                    strokeWidth={0}
                    dot={{ r: 2.5, fill: "var(--muted-foreground)" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="trend"
                    name={`7-day trend (${unitLabel})`}
                    stroke="var(--primary)"
                    strokeWidth={3}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
      <ExportButton kind="weight" />
    </>
  );
}

/* ----------------------- Measurements ----------------------- */

function MeasurementSection({ measurements }: { measurements: MeasurementLogRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);
  const [site, setSite] = React.useState("waist");
  const [value, setValue] = React.useState("");

  const submit = () =>
    startTransition(async () => {
      setError(null);
      const result = await logMeasurement({
        date: todayISO(),
        site,
        valueCm: Number(value),
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setValue("");
      router.refresh();
    });

  return (
    <>
      <Card>
        <CardContent className="flex items-end gap-2 pt-4 sm:pt-5">
          <div className="w-36 space-y-1.5">
            <Label htmlFor="ms-site">Site</Label>
            <Select id="ms-site" value={site} onChange={(e) => setSite(e.target.value)}>
              {Object.entries(SITE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex-1 space-y-1.5">
            <Label htmlFor="ms-value">Measurement (cm)</Label>
            <Input
              id="ms-value"
              type="number"
              step={0.1}
              min={1}
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
          </div>
          <Button disabled={pending} onClick={submit}>
            {pending ? "Saving…" : "Log"}
          </Button>
        </CardContent>
        {error ? (
          <CardContent className="pt-0 text-sm text-destructive">{error}</CardContent>
        ) : null}
      </Card>

      <Card>
        <CardContent className="pt-4 sm:pt-5">
          {measurements.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No measurements yet. A monthly waist measurement often tells you more
              than the scale does.
            </p>
          ) : (
            <ul className="divide-y">
              {measurements.map((m) => (
                <li key={m.id} className="flex items-center justify-between py-2 text-sm">
                  <span>
                    {SITE_LABELS[m.site] ?? m.site}
                    <span className="ml-2 text-xs text-muted-foreground">{m.date}</span>
                  </span>
                  <span className="font-medium">{Number(m.value_cm)} cm</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
      <ExportButton kind="measurements" />
    </>
  );
}

/* --------------------------- Photos ------------------------- */

function PhotoSection({ photos }: { photos: PhotoWithUrl[] }) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [compare, setCompare] = React.useState<string[]>([]);

  const upload = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in");
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("progress-photos")
        .upload(path, file, { contentType: file.type });
      if (upErr) throw upErr;
      const result = await savePhotoRecord({ date: todayISO(), storagePath: path });
      if (!result.ok) throw new Error(result.error);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const toggleCompare = (id: string) =>
    setCompare((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev.slice(-1), id]
    );

  const compared = photos.filter((p) => compare.includes(p.id));

  return (
    <>
      <Card>
        <CardContent className="space-y-3 pt-4 sm:pt-5">
          <Label htmlFor="photo-upload" className="flex items-center gap-2">
            <Camera className="size-4 text-primary" /> Add a progress photo
          </Label>
          <Input
            id="photo-upload"
            type="file"
            accept="image/*"
            disabled={uploading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void upload(file);
            }}
          />
          <p className="text-xs text-muted-foreground">
            Stored in a private bucket only you can access. Tap two photos below to
            compare them side by side.
          </p>
          {uploading ? <p className="text-sm text-muted-foreground">Uploading…</p> : null}
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </CardContent>
      </Card>

      {compared.length === 2 ? (
        <Card>
          <CardHeader>
            <CardTitle>Side by side</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2">
            {compared.map((p) => (
              <figure key={p.id}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.url ?? ""} alt={`Progress photo from ${p.date}`} className="w-full rounded-md" />
                <figcaption className="mt-1 text-center text-xs text-muted-foreground">
                  {p.date}
                </figcaption>
              </figure>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {photos.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            No photos yet. Photos capture change the scale can&apos;t see.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {photos.map((p) => (
            <div key={p.id} className="relative">
              <button
                type="button"
                onClick={() => toggleCompare(p.id)}
                className={`block w-full overflow-hidden rounded-md border-2 ${
                  compare.includes(p.id) ? "border-primary" : "border-transparent"
                }`}
                aria-label={`Select photo from ${p.date} for comparison`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.url ?? ""} alt={`Progress photo from ${p.date}`} className="aspect-square w-full object-cover" />
              </button>
              <p className="mt-1 text-center text-xs text-muted-foreground">{p.date}</p>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1 size-7 bg-black/40 text-white hover:bg-black/60"
                aria-label={`Delete photo from ${p.date}`}
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    await deleteProgressPhoto(p.id);
                    router.refresh();
                  })
                }
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

/* --------------------------- Export ------------------------- */

export function ExportButton({ kind }: { kind: string }) {
  return (
    <a href={`/api/export?kind=${kind}`} download>
      <Button variant="outline" size="sm" className="w-full">
        <Download /> Export {kind} to CSV — free, always
      </Button>
    </a>
  );
}
