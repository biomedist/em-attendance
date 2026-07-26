import { Suspense } from "react";
import { notFound } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { AttendanceSheet } from "@/components/AttendanceSheet";
import { BottomNav } from "@/components/BottomNav";
import { SetupBanner } from "@/components/SetupBanner";
import { WeekSelector } from "@/components/WeekSelector";
import { getSundayDate } from "@/lib/dates";
import {
  fetchAttendanceForWeek,
  fetchGroupById,
  fetchStudentsByGroup,
} from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import type { AttendanceStatus } from "@/lib/types";

export default async function GroupPage({
  params,
  searchParams,
}: {
  params: Promise<{ groupId: string }>;
  searchParams: Promise<{ week?: string }>;
}) {
  const { groupId } = await params;
  const { week } = await searchParams;
  const weekDate = week ?? getSundayDate();
  const configured = isSupabaseConfigured();

  if (!configured) {
    return (
      <div className="flex min-h-full flex-col bg-stone-50">
        <AppHeader title={`Group ${groupId.toUpperCase()}`} backHref="/" />
        <SetupBanner />
        <BottomNav />
      </div>
    );
  }

  const group = await fetchGroupById(groupId);
  if (!group) notFound();

  const students = await fetchStudentsByGroup(groupId);
  const records = await fetchAttendanceForWeek(
    weekDate,
    students.map((s) => s.id)
  );

  const initialRecords = Object.fromEntries(
    records.map((r) => [r.studentId, r.status])
  ) as Record<string, AttendanceStatus>;

  return (
    <div className="flex min-h-full flex-col bg-stone-50">
      <AppHeader
        title={`Group ${group.id} Attendance`}
        subtitle={group.teacher ?? undefined}
        backHref="/"
      />

      <main className="mx-auto w-full max-w-lg flex-1 px-4 pb-28 pt-4">
        <div className="mb-4">
          <Suspense
            fallback={
              <div className="h-14 animate-pulse rounded-xl bg-stone-200" />
            }
          >
            <WeekSelector weekDate={weekDate} />
          </Suspense>
        </div>

        {students.length === 0 ? (
          <div className="rounded-xl bg-white p-8 text-center shadow-sm ring-1 ring-stone-200/60">
            <p className="text-stone-500">No students in this group yet.</p>
            <button
              type="button"
              className="mt-3 text-sm font-medium text-amber-600 hover:text-amber-700"
            >
              + Add Student
            </button>
          </div>
        ) : (
          <AttendanceSheet
            groupId={groupId}
            weekDate={weekDate}
            students={students}
            initialRecords={initialRecords}
          />
        )}
      </main>

      <BottomNav />
    </div>
  );
}
