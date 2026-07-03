import { GentleProvider } from "@/components/gentle";
import { DesktopSidebar, MobileTabBar } from "@/components/nav";
import { getSession } from "@/lib/data";

export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { profile } = await getSession();

  return (
    <GentleProvider gentle={profile.gentle_mode}>
      <DesktopSidebar />
      <div className="min-h-screen pb-20 md:pb-8 md:pl-56">
        <main className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6">{children}</main>
      </div>
      <MobileTabBar />
    </GentleProvider>
  );
}
