import { Suspense } from "react";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { OfferingTable } from "@/components/OfferingTable";
import { SetupBanner } from "@/components/SetupBanner";
import { WeekSelector } from "@/components/WeekSelector";
import { getSundayDate } from "@/lib/dates";
import {
  fetchAttendanceSummaryForWeek,
  fetchMonthlyStats,
  fetchOfferingForWeek,
} from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/supabase/client";

export default async function OfferingPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const { week } = await searchParams;
  const weekDate = week ?? getSundayDate();
  const configured = isSupabaseConfigured();

  if (!configured) {
    return (
      <div className="flex min-h-full flex-col bg-stone-50">
        <AppHeader title="Weekly Offering" subtitle="Sunday offering & attendance" />
        <SetupBanner />
        <BottomNav />
      </div>
    );
  }

  const [offering, summary, monthlyStats] = await Promise.all([
    fetchOfferingForWeek(weekDate),
    fetchAttendanceSummaryForWeek(weekDate),
    fetchMonthlyStats(),
  ]);

  return (
    <div className="flex min-h-full flex-col bg-stone-50">
      <AppHeader title="Weekly Offering" subtitle="Sunday offering & attendance" />

      <main className="mx-auto w-full max-w-lg flex-1 px-4 pb-28 pt-4">
        <div className="mb-4">
          <Suspense
            fallback={<div className="h-14 animate-pulse rounded-xl bg-stone-200" />}
          >
            <WeekSelector weekDate={weekDate} />
          </Suspense>
        </div>
        <OfferingTable
          weekDate={weekDate}
          initialAmount={offering?.amount ?? 0}
          summary={summary}
          monthlyStats={monthlyStats}
        />
      </main>

      <BottomNav />
    </div>
  );
}