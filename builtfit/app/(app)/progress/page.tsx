import type { Metadata } from "next";
import { ProgressTabs } from "@/components/progress-tabs";
import { getSession, getWeightLogs } from "@/lib/data";
import type { MeasurementLogRow, ProgressPhotoRow } from "@/lib/types";

export const metadata: Metadata = { title: "Progress" };

export default async function ProgressPage() {
  const { supabase, userId, profile } = await getSession();

  const [weights, measurementsRes, photosRes] = await Promise.all([
    getWeightLogs(supabase, userId),
    supabase
      .from("measurement_logs")
      .select("*")
      .eq("user_id", userId)
      .order("date", { ascending: false })
      .limit(50),
    supabase
      .from("progress_photos")
      .select("*")
      .eq("user_id", userId)
      .order("date", { ascending: false })
      .limit(60),
  ]);

  const photos = (photosRes.data ?? []) as ProgressPhotoRow[];
  const withUrls = await Promise.all(
    photos.map(async (p) => {
      const { data } = await supabase.storage
        .from("progress-photos")
        .createSignedUrl(p.storage_path, 3600);
      return { ...p, url: data?.signedUrl ?? null };
    })
  );

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Progress</h1>
      <ProgressTabs
        weights={weights}
        measurements={(measurementsRes.data ?? []) as MeasurementLogRow[]}
        photos={withUrls}
        units={profile.units}
      />
    </div>
  );
}
