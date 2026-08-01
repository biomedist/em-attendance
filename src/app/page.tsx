import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { GroupCard } from "@/components/GroupCard";
import { SetupBanner } from "@/components/SetupBanner";
import { formatWeekLabel, getSundayDate } from "@/lib/dates";
import { fetchGroups } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import type { Group } from "@/lib/types";

export const dynamic = "force-dynamic";
export default async function HomePage() {
  const configured = isSupabaseConfigured();
  let groups: Group[] = [];
  let error: string | null = null;

  if (configured) {
    try {
      groups = await fetchGroups();
    } catch (e) {
      error = e instanceof Error ? e.message : "Failed to load groups";
    }
  }

  const totalStudents = groups.reduce((sum, g) => sum + g.studentCount, 0);
  const weekDate = getSundayDate();

  return (
    <div className="flex min-h-full flex-col bg-stone-50">
      <AppHeader
        title="Attendance"
        subtitle={
          groups.length > 0
            ? `${groups.length} groups · ${totalStudents} students`
            : "EM Children Ministry"
        }
      />

      {!configured && <SetupBanner />}

      {error && (
        <div className="mx-4 mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {error}. Run <code className="rounded bg-red-100 px-1">supabase/schema.sql</code> in
          the SQL Editor if you haven&apos;t yet.
        </div>
      )}

      <main className="mx-auto w-full max-w-lg flex-1 px-4 pb-28 pt-4">
        <section className="mb-5 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 p-5 text-white shadow-lg shadow-amber-200/40">
          <p className="text-sm font-medium text-amber-100">
            {formatWeekLabel(weekDate)}
          </p>
          <h2 className="mt-1 text-xl font-bold">EM Children Ministry</h2>
          <p className="mt-2 text-sm text-amber-100/90">
            Select a group to take attendance
          </p>
        </section>

        <Link
          href="/groups/manage"
          className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-700"
        >
          Manage Groups
        </Link>

        {groups.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {groups.map((group) => (
              <GroupCard key={group.id} group={group} />
            ))}
          </div>
        ) : configured && !error ? (
          <p className="text-center text-sm text-stone-500">
            No groups found. Run the schema SQL to seed groups A–E.
          </p>
        ) : null}
      </main>

      <BottomNav />
    </div>
  );
}
