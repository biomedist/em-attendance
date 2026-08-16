"use client";

import { useState, useTransition } from "react";
import { saveAttendance, addStudent, removeStudent, updateStudent } from "@/app/actions";
import type { AttendanceStatus, Student } from "@/lib/types";

const STATUS_OPTIONS: { value: AttendanceStatus; label: string; activeClass: string }[] = [
  { value: "present", label: "Present", activeClass: "bg-emerald-500 text-white shadow-sm" },
  { value: "absent", label: "Absent", activeClass: "bg-stone-400 text-white shadow-sm" },
];

const DEFAULT_STATUS: AttendanceStatus = "present";

function StudentEditForm({
  student,
  groupId,
  onCancel,
  isPending,
  startTransition,
}: {
  student: Student;
  groupId: string;
  onCancel: () => void;
  isPending: boolean;
  startTransition: (fn: () => Promise<void>) => void;
}) {
  const [name, setName] = useState(student.name);
  const [grade, setGrade] = useState(student.grade ?? "");
  const [dob, setDob] = useState(student.dob ?? "");
  const [contact, setContact] = useState(student.contactInfo ?? "");

  function handleSave() {
    if (!name.trim()) return;
    startTransition(async () => {
      await updateStudent(
        student.id,
        groupId,
        name.trim(),
        grade.trim() || undefined,
        dob || undefined,
        contact.trim() || undefined
      );
      onCancel();
    });
  }

  return (
    <div className="space-y-2 rounded-xl bg-stone-50 p-3">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Name"
        className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none"
      />
      <input
        type="text"
        value={grade}
        onChange={(e) => setGrade(e.target.value)}
        placeholder="Grade (optional)"
        className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none"
      />
      <input
        type="date"
        value={dob}
        onChange={(e) => setDob(e.target.value)}
        className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none"
      />
      <input
        type="text"
        value={contact}
        onChange={(e) => setContact(e.target.value)}
        placeholder="Contact info (optional)"
        className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none"
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
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

export function AttendanceSheet({
  groupId,
  weekDate,
  students,
  initialRecords,
}: {
  groupId: string;
  weekDate: string;
  students: Student[];
  initialRecords: Record<string, AttendanceStatus>;
}) {
  const [statuses, setStatuses] = useState<Record<string, AttendanceStatus>>(() =>
    Object.fromEntries(students.map((s) => [s.id, initialRecords[s.id] ?? DEFAULT_STATUS]))
  );
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newGrade, setNewGrade] = useState("");
  const [newDob, setNewDob] = useState("");
  const [newContact, setNewContact] = useState("");

  const presentCount = Object.values(statuses).filter((s) => s === "present").length;

  function setStatus(studentId: string, status: AttendanceStatus) {
    setStatuses((prev) => ({ ...prev, [studentId]: status }));
    setMessage(null);
  }

  function handleSave() {
    startTransition(async () => {
      const records = students.map((s) => ({
        studentId: s.id,
        status: statuses[s.id] ?? DEFAULT_STATUS,
      }));
      const result = await saveAttendance(groupId, weekDate, records);
      setMessage(result.ok ? "Saved!" : result.error ?? "Save failed");
    });
  }

  function handleAddStudent() {
    if (!newName.trim()) return;
    startTransition(async () => {
      await addStudent(
        groupId,
        newName.trim(),
        newGrade.trim() || undefined,
        newDob || undefined,
        newContact.trim() || undefined
      );
      setNewName("");
      setNewGrade("");
      setNewDob("");
      setNewContact("");
      setShowAddForm(false);
    });
  }

  function handleRemoveStudent(studentId: string) {
    if (!confirm("Remove this person from the group?")) return;
    startTransition(async () => {
      await removeStudent(studentId, groupId);
    });
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between rounded-xl bg-white px-4 py-3 shadow-sm ring-1 ring-stone-200/60">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-stone-400">Attendance</p>
          <p className="text-lg font-semibold text-stone-800">
            {presentCount}
            <span className="text-sm font-normal text-stone-400"> / {students.length}</span>
          </p>
        </div>
        <div className="flex gap-3 text-xs text-stone-500">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Present
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-stone-400" />
            Absent
          </span>
        </div>
      </div>

// 파일 상단 import에 reorderStudents 추가
import { saveAttendance, addStudent, removeStudent, updateStudent, reorderStudents } from "@/app/actions";

// AttendanceSheet 함수 안, statuses useState 아래에 추가:
const [orderedStudents, setOrderedStudents] = useState(students);
const [dragIndex, setDragIndex] = useState<number | null>(null);

function handleDragStart(index: number) {
  setDragIndex(index);
}

function handleDragOver(e: React.DragEvent, index: number) {
  e.preventDefault();
  if (dragIndex === null || dragIndex === index) return;
  const next = [...orderedStudents];
  const [moved] = next.splice(dragIndex, 1);
  next.splice(index, 0, moved);
  setOrderedStudents(next);
  setDragIndex(index);
}

function handleDragEnd() {
  setDragIndex(null);
  const updates = orderedStudents.map((s, i) => ({ id: s.id, sort_order: i + 1 }));
  startTransition(async () => {
    await reorderStudents(updates);
  });
}

      <div className="mt-3">
        {showAddForm ? (
          <div className="space-y-2 rounded-xl bg-white p-3 shadow-sm ring-1 ring-stone-200/60">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Name"
              className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
            />
            <input
              type="text"
              value={newGrade}
              onChange={(e) => setNewGrade(e.target.value)}
              placeholder="Grade (optional)"
              className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
            />
            <input
              type="date"
              value={newDob}
              onChange={(e) => setNewDob(e.target.value)}
              className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
            />
            <input
              type="text"
              value={newContact}
              onChange={(e) => setNewContact(e.target.value)}
              placeholder="Contact info (optional)"
              className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleAddStudent}
                disabled={isPending}
                className="flex-1 rounded-lg bg-stone-900 py-2 text-xs font-semibold text-white"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="flex-1 rounded-lg bg-stone-100 py-2 text-xs font-semibold text-stone-600"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="w-full rounded-xl border border-dashed border-stone-300 py-2.5 text-sm font-medium text-stone-500 hover:bg-stone-100"
          >
            + Add Person
          </button>
        )}
      </div>

      {message && (
        <p className={`mt-3 text-center text-sm ${message === "Saved!" ? "text-emerald-600" : "text-red-600"}`}>
          {message}
        </p>
      )}

      <button
        type="button"
        onClick={handleSave}
        disabled={isPending}
        className="mt-4 w-full rounded-xl bg-stone-900 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-stone-800 active:scale-[0.99] disabled:opacity-60"
      >
        {isPending ? "Saving…" : "Save Attendance"}
      </button>
    </div>
  );
}
