"use client";

import { useState, useTransition } from "react";
import { addNotice, updateNotice, deleteNotice } from "@/app/actions";
import { formatDate } from "@/lib/dates";
import type { Notice } from "@/lib/types";

const TYPE_STYLES: Record<Notice["type"], { badge: string; dot: string; label: string }> = {
  event: { badge: "bg-violet-100 text-violet-700", dot: "bg-violet-500", label: "Event" },
  announcement: { badge: "bg-sky-100 text-sky-700", dot: "bg-sky-500", label: "Notice" },
  holiday: { badge: "bg-stone-100 text-stone-600", dot: "bg-stone-400", label: "No Class" },
};

const TYPE_OPTIONS: { value: Notice["type"]; label: string }[] = [
  { value: "event", label: "Event" },
  { value: "announcement", label: "Notice" },
  { value: "holiday", label: "No Class" },
];

type FormState = { date: string; title: string; description: string; type: Notice["type"] };
const EMPTY_FORM: FormState = { date: "", title: "", description: "", type: "event" };

function NoticeForm({
  initial,
  onCancel,
  onSubmit,
  isPending,
}: {
  initial: FormState;
  onCancel: () => void;
  onSubmit: (form: FormState) => void;
  isPending: boolean;
}) {
  const [form, setForm] = useState<FormState>(initial);
  return (
    <div className="space-y-2 rounded-xl bg-white p-4 shadow-sm ring-1 ring-stone-200/60">
      <input
        type="date"
        value={form.date}
        onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
        className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none"
      />
      <input
        type="text"
        value={form.title}
        onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
        placeholder="Title"
        className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none"
      />
      <textarea
        value={form.description}
        onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
        placeholder="Description (optional)"
        rows={2}
        className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none"
      />
      <select
        value={form.type}
        onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as Notice["type"] }))}
        className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none"
      >
        {TYPE_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onSubmit(form)}
          disabled={isPending || !form.date || !form.title.trim()}
          className="flex-1 rounded-lg bg-stone-900 py-2 text-xs font-semibold text-white disabled:opacity-60"
        >
          Save
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-lg bg-stone-100 py-2 text-xs font-semibold text-stone-600"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function NoticeItem({
  notice,
  onEdit,
  onDelete,
}: {
  notice: Notice;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const style = TYPE_STYLES[notice.type];
  return (
    <li className="relative pl-6">
      <span className={`absolute left-0 top-2 h-2.5 w-2.5 rounded-full ring-4 ring-white ${style.dot}`} />
      <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-stone-200/60">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${style.badge}`}>
              {style.label}
            </span>
            <time className="text-xs text-stone-400">{formatDate(notice.date)}</time>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={onEdit} className="text-xs text-stone-400 hover:text-stone-700">
              Edit
            </button>
            <button type="button" onClick={onDelete} className="text-xs text-red-400 hover:text-red-600">
              Delete
            </button>
          </div>
        </div>
        <h3 className="font-semibold text-stone-800">{notice.title}</h3>
        {notice.description && (
          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-stone-600">{notice.description}</p>
        )}
      </div>
    </li>
  );
}

export function NoticeTimeline({ notices }: { notices: Notice[] }) {
  const [isPending, startTransition] = useTransition();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const sorted = [...notices].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  function handleAdd(form: FormState) {
    startTransition(async () => {
      await addNotice(form.date, form.title.trim(), form.type, form.description.trim() || undefined);
      setShowAddForm(false);
    });
  }

  function handleUpdate(id: string, form: FormState) {
    startTransition(async () => {
      await updateNotice(id, form.date, form.title.trim(), form.type, form.description.trim() || undefined);
      setEditingId(null);
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Delete this notice?")) return;
    startTransition(async () => {
      await deleteNotice(id);
    });
  }

  return (
    <div>
      {showAddForm ? (
        <div className="mb-4">
          <NoticeForm initial={EMPTY_FORM} onCancel={() => setShowAddForm(false)} onSubmit={handleAdd} isPending={isPending} />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowAddForm(true)}
          className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-stone-200 py-3 text-sm font-medium text-stone-500 transition-colors hover:border-amber-300 hover:bg-amber-50/50 hover:text-amber-700"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add Notice
        </button>
      )}

      {sorted.length === 0 ? (
        <p className="text-center text-sm text-stone-500">No notices yet.</p>
      ) : (
        <ol className="relative ml-1 space-y-4 border-l-2 border-stone-200">
          {sorted.map((notice) =>
            editingId === notice.id ? (
              <li key={notice.id} className="relative pl-6">
                <NoticeForm
                  initial={{ date: notice.date, title: notice.title, description: notice.description ?? "", type: notice.type }}
                  onCancel={() => setEditingId(null)}
                  onSubmit={(form) => handleUpdate(notice.id, form)}
                  isPending={isPending}
                />
              </li>
            ) : (
              <NoticeItem key={notice.id} notice={notice} onEdit={() => setEditingId(notice.id)} onDelete={() => handleDelete(notice.id)} />
            )
          )}
        </ol>
      )}
    </div>
  );
}
