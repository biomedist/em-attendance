"use server";

import { revalidatePath } from "next/cache";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/client";
import type { AttendanceStatus } from "@/lib/types";

export async function saveAttendance(
  groupId: string,
  weekDate: string,
  records: { studentId: string; status: AttendanceStatus }[]
): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseConfigured()) return { ok: false, error: "Supabase is not configured" };
  const supabase = getSupabase();
  const memberType = groupId === "TEACHER" ? "teacher" : "student";
  const rows = records.map((r) => ({
    student_id: r.studentId,
    week_date: weekDate,
    status: r.status,
    group_id: groupId,
    member_type: memberType,
    updated_at: new Date().toISOString(),
  }));
  const { error } = await supabase
    .from("attendance_records")
    .upsert(rows, { onConflict: "student_id,week_date" });
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/groups/${groupId}`);
  revalidatePath("/offering");
  revalidatePath("/");
  return { ok: true };
}

export async function saveOffering(
  weekDate: string,
  amount: number,
  note?: string
): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseConfigured()) return { ok: false, error: "Supabase is not configured" };
  const supabase = getSupabase();
  const { error } = await supabase.from("offerings").upsert(
    [{ week_date: weekDate, amount, note: note ?? null, updated_at: new Date().toISOString() }],
    { onConflict: "week_date" }
  );
  if (error) return { ok: false, error: error.message };
  revalidatePath("/offering");
  return { ok: true };
}

export async function addStudent(
  groupId: string,
  name: string,
  grade?: string
): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseConfigured()) return { ok: false, error: "Supabase is not configured" };
  const supabase = getSupabase();
  const { error } = await supabase
    .from("students")
    .insert([{ group_id: groupId, name, grade: grade ?? null }]);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/groups/${groupId}`);
  revalidatePath("/");
  return { ok: true };
}

export async function removeStudent(
  studentId: string,
  groupId: string
): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseConfigured()) return { ok: false, error: "Supabase is not configured" };
  const supabase = getSupabase();
  const { error } = await supabase.from("students").update({ active: false }).eq("id", studentId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/groups/${groupId}`);
  revalidatePath("/");
  return { ok: true };
}

export async function addGroup(
  id: string,
  name: string,
  teacher?: string
): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseConfigured()) return { ok: false, error: "Supabase is not configured" };
  const supabase = getSupabase();
  const { error } = await supabase
    .from("groups")
    .insert([{ id: id.toUpperCase(), name, teacher: teacher ?? null, sort_order: 99 }]);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/");
  return { ok: true };
}

export async function removeGroup(id: string): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseConfigured()) return { ok: false, error: "Supabase is not configured" };
  const supabase = getSupabase();
  const { error } = await supabase.from("groups").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/");
  return { ok: true };
}

export async function updateGroupTeacher(
  id: string,
  teacher: string
): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseConfigured()) return { ok: false, error: "Supabase is not configured" };
  const supabase = getSupabase();
  const { error } = await supabase.from("groups").update({ teacher }).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/");
  return { ok: true };
}

export async function addNotice(
  date: string,
  title: string,
  type: "event" | "announcement" | "holiday",
  description?: string
): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseConfigured()) return { ok: false, error: "Supabase is not configured" };
  const supabase = getSupabase();
  const { error } = await supabase
    .from("notices")
    .insert([{ date, title, type, description: description ?? null }]);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/notice");
  return { ok: true };
}

export async function updateNotice(
  id: string,
  date: string,
  title: string,
  type: "event" | "announcement" | "holiday",
  description?: string
): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseConfigured()) return { ok: false, error: "Supabase is not configured" };
  const supabase = getSupabase();
  const { error } = await supabase
    .from("notices")
    .update({ date, title, type, description: description ?? null })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/notice");
  return { ok: true };
}

export async function deleteNotice(id: string): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseConfigured()) return { ok: false, error: "Supabase is not configured" };
  const supabase = getSupabase();
  const { error } = await supabase.from("notices").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/notice");
  return { ok: true };
}