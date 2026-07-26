"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { formatWeekLabel, shiftWeek } from "@/lib/dates";

export function WeekSelector({ weekDate }: { weekDate: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function navigate(weeks: number) {
    const next = shiftWeek(weekDate, weeks);
    const params = new URLSearchParams(searchParams.toString());
    params.set("week", next);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex items-center justify-between rounded-xl border border-stone-200 bg-white px-3 py-2 shadow-sm">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-800"
        aria-label="Previous week"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
        </svg>
      </button>
      <div className="text-center">
        <p className="text-sm font-semibold text-stone-800">
          {formatWeekLabel(weekDate)}
        </p>
        <p className="text-xs text-stone-400">Sunday week</p>
      </div>
      <button
        type="button"
        onClick={() => navigate(1)}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-800"
        aria-label="Next week"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
        </svg>
      </button>
    </div>
  );
}
