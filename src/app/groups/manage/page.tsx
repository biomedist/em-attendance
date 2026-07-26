
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { ManageGroupsForm } from "@/components/ManageGroupsForm";
import { SetupBanner } from "@/components/SetupBanner";
import { fetchGroups } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/supabase/client";

export default async function ManageGroupsPage() {
  const configured = isSupabaseConfigured();
  const groups = configured ? await fetchGroups() : [];

  return (
    <div className="flex min-h-full flex-col bg-stone-50">
      <AppHeader title="Manage Groups" backHref="/" />
      {!configured && <SetupBanner />}
      <main className="mx-auto w-full max-w-lg flex-1 px-4 pb-28 pt-4">
        <ManageGroupsForm groups={groups} />
      </main>
      <BottomNav />
    </div>
  );
}