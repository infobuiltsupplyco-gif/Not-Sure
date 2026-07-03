import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default function SetupPage() {
  if (isSupabaseConfigured()) redirect("/dashboard");

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-6">
      <Card>
        <CardHeader>
          <CardTitle>BuiltFit needs a Supabase project</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            The app is running, but no Supabase credentials are configured, so
            auth and data storage are offline.
          </p>
          <ol className="list-decimal space-y-2 pl-5">
            <li>Create a free project at supabase.com.</li>
            <li>
              Copy <code className="rounded bg-muted px-1">.env.local.example</code> to{" "}
              <code className="rounded bg-muted px-1">.env.local</code> and fill in the
              URL and anon key.
            </li>
            <li>
              Run the migration in <code className="rounded bg-muted px-1">supabase/migrations/0001_init.sql</code>{" "}
              and the seed in <code className="rounded bg-muted px-1">supabase/seed.sql</code>.
            </li>
            <li>Restart the dev server.</li>
          </ol>
          <p>Full steps are in the README.</p>
        </CardContent>
      </Card>
    </main>
  );
}
