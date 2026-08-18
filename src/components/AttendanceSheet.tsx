"use client";

import React, { useState, useTransition } from "react";
import { saveAttendance, addStudent, removeStudent, updateStudent, reorderStudents } from "@/app/actions";
import type { AttendanceStatus, Student } from "@/lib/types";

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length < 4) return digits;
  if (digits.length < 8) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}

const STATUS_OPTIONS: { value: AttendanceStatus; label: string; activeClass: string }[] = [
  { value: "present", label: "Present", activeClass: "bg-emerald-500 text-white shadow-sm" },
  { value: "absent", label: "Absent", activeClass: "bg-stone-400 text-white shadow-sm" },
];

const DEFAULT_STATUS: AttendanceStatus = "present";

function StudentEditForm({
  student,
  groupId,
  onCancel,
  onSaved,
  isPending,
  startTransition,
}: {
  student: Student;
  groupId: string;
  onCancel: () => void;
  onSaved: (updated: Student) => void;
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
      onSaved({
        ...student,
        name: name.trim(),
        grade: grade.trim() || null,
        dob: dob || null,
        contactInfo: contact.trim() || null,
      });
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
        type="tel"
        value={contact}
        onChange={(e) => setContact(formatPhone(e.target.value))}
        placeholder="010-0000-0000"
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
  const [orderedStudents, setOrderedStudents] = useState<Student[]>(students);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
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

  // 드래그 (PC)
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
  
  // 터치 (모바일) - 롱프레스 후 드래그
  const touchDragIndex = React.useRef<number | null>(null);
  const longPressTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isDraggingTouch, setIsDraggingTouch] = useState(false);
  
  function handleTouchStart(e: React.TouchEvent, index: number) {
    longPressTimer.current = setTimeout(() => {
      touchDragIndex.current = index;
      setDragIndex(index);
      setIsDraggingTouch(true);
      // 진동 피드백 (지원하는 기기에서)
      if (navigator.vibrate) navigator.vibrate(50);
    }, 400); // 400ms 롱프레스
  }
  
  function handleTouchMove(e: React.TouchEvent) {
    if (!isDraggingTouch || touchDragIndex.current === null) {
      // 롱프레스 전에 움직이면 타이머 취소
      if (longPressTimer.current) clearTimeout(longPressTimer.current);
      return;
    }
    e.preventDefault();
  
    const touch = e.touches[0];
    const elements = document.elementsFromPoint(touch.clientX, touch.clientY);
    const liEl = elements.find((el) => el.getAttribute("data-student-index") !== null);
    if (!liEl) return;
  
    const targetIndex = Number(liEl.getAttribute("data-student-index"));
    if (targetIndex === touchDragIndex.current) return;
  
    const next = [...orderedStudents];
    const [moved] = next.splice(touchDragIndex.current, 1);
    next.splice(targetIndex, 0, moved);
    setOrderedStudents(next);
    touchDragIndex.current = targetIndex;
    setDragIndex(targetIndex);
  }
  
  function handleTouchEnd() {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    if (isDraggingTouch) {
      setIsDraggingTouch(false);
      setDragIndex(null);
      touchDragIndex.current = null;
      const updates = orderedStudents.map((s, i) => ({ id: s.id, sort_order: i + 1 }));
      startTransition(async () => {
        await reorderStudents(updates);
      });
    }
  }

  function handleSave() {
    startTransition(async () => {
      const records = orderedStudents.map((s) => ({
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
  function handleStudentUpdated(updated: Student) {
  setOrderedStudents((prev) =>
    prev.map((s) => (s.id === updated.id ? updated : s))
  );
}
  return (
    <div>
      {/* 출석 요약 헤더 */}
      <div className="mb-4 flex items-center justify-between rounded-xl bg-white px-4 py-3 shadow-sm ring-1 ring-stone-200/60">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-stone-400">Attendance</p>
          <p className="text-lg font-semibold text-stone-800">
            {presentCount}
            <span className="text-sm font-normal text-stone-400"> / {orderedStudents.length}</span>
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

      {/* 학생 목록 */}
      <ul className="space-y-2">
        {orderedStudents.map((student, index) =>
          editingId === student.id ? (
            <li key={student.id} className="rounded-xl bg-white p-3 shadow-sm ring-1 ring-stone-200/60">
              <StudentEditForm
                student={student}
                groupId={groupId}
                onCancel={() => setEditingId(null)}
                onSaved={handleStudentUpdated}
                isPending={isPending}
                startTransition={startTransition}
              />
            </li>
          ) : (
            <li
              key={student.id}
              data-student-index={index}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              onTouchStart={(e) => handleTouchStart(e, index)}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              className={`rounded-xl bg-white p-3 shadow-sm ring-1 ring-stone-200/60 transition-opacity ${
                dragIndex === index ? "opacity-50" : "opacity-100"
              }`}
              style={{ touchAction: isDraggingTouch ? "none" : "auto" }}
            >
              <div className="mb-2.5 flex items-center gap-2">
                {/* 드래그 핸들 */}
                <span className="cursor-grab shrink-0 text-stone-300 active:cursor-grabbing">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9h16.5m-16.5 6.75h16.5" />
                  </svg>
                </span>
                {/* 번호 */}
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-stone-100 text-xs font-semibold text-stone-500">
                  {index + 1}
                </span>
                {/* 이름/학년/연락처 */}
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-stone-800">{student.name}</p>
                  {(student.grade || student.dob) && (
                    <p className="text-xs font-semibold text-stone-600">
                      {student.grade && `Grade ${student.grade}`}
                      {student.grade && student.dob && " · "}
                      {student.dob}
                    </p>
                  )}
                  {student.contactInfo && (
                    <a
                      href={`tel:${student.contactInfo.replace(/\D/g, "")}`}
                      className="text-xs text-sky-500 hover:text-sky-600"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {student.contactInfo}
                    </a>
                  )}
                </div>
                {/* Edit/Remove 버튼 */}
                <div className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    onClick={() => setEditingId(student.id)}
                    className="rounded-lg px-2 py-1 text-xs text-stone-400 hover:bg-stone-100 hover:text-stone-700"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveStudent(student.id)}
                    className="rounded-lg px-2 py-1 text-xs text-red-400 hover:bg-red-50 hover:text-red-600"
                  >
                    Remove
                  </button>
                </div>
              </div>

              {/* 출석 버튼 */}
              <div className="flex gap-1">
                {STATUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setStatus(student.id, opt.value)}
                    className={`flex-1 rounded-lg py-1.5 text-[11px] font-medium transition-all ${
                      statuses[student.id] === opt.value
                        ? opt.activeClass
                        : "bg-stone-50 text-stone-500 hover:bg-stone-100"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </li>
          )
        )}
      </ul>

      {/* 추가 폼 */}
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
              type="tel"
              value={newContact}
              onChange={(e) => setNewContact(formatPhone(e.target.value))}
              placeholder="010-0000-0000"
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
