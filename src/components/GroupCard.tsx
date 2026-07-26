import Link from "next/link";
import type { Group } from "@/lib/types";

export function GroupCard({ group }: { group: Group }) {
  return (
    <Link
      href={`/groups/${group.id}`}
      className={`group block rounded-2xl border ${group.borderColor} ${group.bgColor} p-4 transition-all hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98]`}
    >
      <div className="flex items-start justify-between">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-xl bg-white/80 text-xl font-bold shadow-sm ${group.color}`}
        >
          {group.badgeLabel}
        </div>
        <span className="rounded-full bg-white/70 px-2.5 py-0.5 text-xs font-medium text-stone-600">
          {group.studentCount} {group.memberLabel}
        </span>
      </div>
      <div className="mt-3">
        <h3 className={`text-base font-semibold ${group.color}`}>
          {group.name}
        </h3>
        {group.teacher && (
          <p className="mt-2 text-xs text-stone-500">Teacher · {group.teacher}</p>
        )}
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-white/60 pt-3">
        <span className="text-xs font-medium text-stone-500">Open attendance</span>
        <svg
          className={`h-4 w-4 ${group.color} transition-transform group-hover:translate-x-0.5`}
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
        </svg>
      </div>
    </Link>
  );
}
