import { formatDate } from "@/lib/dates";
import type { Notice } from "@/lib/types";

const TYPE_STYLES: Record<
  Notice["type"],
  { badge: string; dot: string; label: string }
> = {
  event: {
    badge: "bg-violet-100 text-violet-700",
    dot: "bg-violet-500",
    label: "Event",
  },
  announcement: {
    badge: "bg-sky-100 text-sky-700",
    dot: "bg-sky-500",
    label: "Notice",
  },
  holiday: {
    badge: "bg-stone-100 text-stone-600",
    dot: "bg-stone-400",
    label: "No Class",
  },
};

function NoticeItem({ notice }: { notice: Notice }) {
  const style = TYPE_STYLES[notice.type];

  return (
    <li className="relative pl-6">
      <span
        className={`absolute left-0 top-2 h-2.5 w-2.5 rounded-full ring-4 ring-white ${style.dot}`}
      />
      <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-stone-200/60">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${style.badge}`}
          >
            {style.label}
          </span>
          <time className="text-xs text-stone-400">{formatDate(notice.date)}</time>
        </div>
        <h3 className="font-semibold text-stone-800">{notice.title}</h3>
        {notice.description && (
          <p className="mt-2 text-sm leading-relaxed text-stone-600">
            {notice.description}
          </p>
        )}
      </div>
    </li>
  );
}

export function NoticeTimeline({ notices }: { notices: Notice[] }) {
  const sorted = [...notices].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  return (
    <div>
      <button
        type="button"
        className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-stone-200 py-3 text-sm font-medium text-stone-500 transition-colors hover:border-amber-300 hover:bg-amber-50/50 hover:text-amber-700"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        Add Notice
      </button>

      {sorted.length === 0 ? (
        <p className="text-center text-sm text-stone-500">No notices yet.</p>
      ) : (
        <ol className="relative ml-1 space-y-4 border-l-2 border-stone-200">
          {sorted.map((notice) => (
            <NoticeItem key={notice.id} notice={notice} />
          ))}
        </ol>
      )}
    </div>
  );
}
