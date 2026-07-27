"use client";

import { useState, useTransition } from "react";
import { addGroup, removeGroup, updateGroupName, updateGroupTeacher } from "@/app/actions";
import type { Group } from "@/lib/types";

export function ManageGroupsForm({ groups }: { groups: Group[] }) {
  const [isPending, startTransition] = useTransition();
  const [newId, setNewId] = useState("");
  const [newName, setNewName] = useState("");
  const [newTeacher, setNewTeacher] = useState("");
  const [nameEdits, setNameEdits] = useState<Record<string, string>>({});
  const [teacherEdits, setTeacherEdits] = useState<Record<string, string>>({});

  function handleAdd() {
    if (!newId.trim() || !newName.trim()) return;
    startTransition(async () => {
      await addGroup(newId.trim(), newName.trim(), newTeacher.trim() || undefined);
      setNewId("");
      setNewName("");
      setNewTeacher("");
    });
  }

  function handleRemove(id: string) {
    if (!confirm(`Delete group "${id}"? This removes all its students and attendance records.`)) return;
    startTransition(async () => {
      await removeGroup(id);
    });
  }

  function handleSaveGroup(id: string) {
    const name = nameEdits[id];
    const teacher = teacherEdits[id];
    startTransition(async () => {
      if (name !== undefined) await updateGroupName(id, name);
      if (teacher !== undefined) await updateGroupTeacher(id, teacher);
    });
  }

  return (
    <div className="space-y-3">
      {groups.map((group) => (
        <div key={group.id} className="rounded-xl bg-white p-3 shadow-sm ring-1 ring-stone-200/60">
          <div className="mb-2 flex items-center justify-between">
            <div className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold ${group.bgColor} ${group.color}`}>
              {group.badgeLabel}
            </div>
            <button
              type="button"
              onClick={() => handleRemove(group.id)}
              className="rounded-lg px-2 py-1 text-xs text-red-400 hover:bg-red-50 hover:text-red-600"
            >
              Delete
            </button>
          </div>
          <div className="space-y-2">
            <input
              type="text"
              defaultValue={group.name}
              onChange={(e) => setNameEdits((prev) => ({ ...prev, [group.id]: e.target.value }))}
              placeholder="Group name"
              className="w-full rounded-lg border border-stone-200 px-3 py-1.5 text-sm focus:border-amber-400 focus:outline-none"
            />
            <div className="flex gap-2">
              <input
                type="text"
                defaultValue={group.teacher ?? ""}
                onChange={(e) => setTeacherEdits((prev) => ({ ...prev, [group.id]: e.target.value }))}
                placeholder="Teacher name"
                className="flex-1 rounded-lg border border-stone-200 px-3 py-1.5 text-sm focus:border-amber-400 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => handleSaveGroup(group.id)}
                disabled={isPending}
                className="rounded-lg bg-stone-900 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      ))}

      <div className="rounded-xl border border-dashed border-stone-300 p-3">
        <p className="mb-2 text-sm font-semibold text-stone-700">+ New Group</p>
        <div className="space-y-2">
          <input
            type="text"
            value={newId}
            onChange={(e) => setNewId(e.target.value.toUpperCase())}
            placeholder="ID (e.g. F)"
            maxLength={10}
            className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none"
          />
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Group name"
            className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none"
          />
          <input
            type="text"
            value={newTeacher}
            onChange={(e) => setNewTeacher(e.target.value)}
            placeholder="Teacher (optional)"
            className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none"
          />
          <button
            type="button"
            onClick={handleAdd}
            disabled={isPending}
            className="w-full rounded-lg bg-stone-900 py-2 text-sm font-semibold text-white"
          >
            Add Group
          </button>
        </div>
      </div>
    </div>
  );
}
