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
  grade?: string,
  dob?: string,
  contactInfo?: string
): Promise<{ ok: boolean; error?: string; student?: { id: string; groupId: string; name: string; grade: string | null; dob: string | null; contactInfo: string | null } }> {
  if (!isSupabaseConfigured()) return { ok: false, error: "Supabase is not configured" };
  const supabase = getSupabase();

  const { data: existing } = await supabase
    .from("students")
    .select("sort_order")
    .eq("group_id", groupId)
    .eq("active", true)
    .order("sort_order", { ascending: false })
    .limit(1);

  const maxOrder = existing?.[0]?.sort_order ?? 0;

  const { data, error } = await supabase
    .from("students")
    .insert([{
      group_id: groupId,
      name,
      grade: grade ?? null,
      dob: dob ?? null,
      contact_info: contactInfo ?? null,
      sort_order: maxOrder + 1,
    }])
    .select()
    .single();

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/groups/${groupId}`);
  revalidatePath("/");
  return {
    ok: true,
    student: {
      id: data.id,
      groupId: data.group_id,
      name: data.name,
      grade: data.grade,
      dob: data.dob,
      contactInfo: data.contact_info,
    },
  };
}

export async function moveStudent(
  studentId: string,
  fromGroupId: string,
  toGroupId: string
): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseConfigured()) return { ok: false, error: "Supabase is not configured" };
  const supabase = getSupabase();

  // 이동할 그룹의 최대 sort_order 조회
  const { data: existing } = await supabase
    .from("students")
    .select("sort_order")
    .eq("group_id", toGroupId)
    .eq("active", true)
    .order("sort_order", { ascending: false })
    .limit(1);

  const maxOrder = existing?.[0]?.sort_order ?? 0;

  const { error } = await supabase
    .from("students")
    .update({ group_id: toGroupId, sort_order: maxOrder + 1 })
    .eq("id", studentId);

  if (error) return { ok: false, error: error.message };
  revalidatePath(`/groups/${fromGroupId}`);
  revalidatePath(`/groups/${toGroupId}`);
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

export async function updateGroupName(
  id: string,
  name: string
): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseConfigured()) return { ok: false, error: "Supabase is not configured" };
  const supabase = getSupabase();
  const { error } = await supabase.from("groups").update({ name }).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/");
  revalidatePath("/groups/manage");
  return { ok: true };
}

export async function updateStudent(
  id: string,
  groupId: string,
  name: string,
  grade?: string,
  dob?: string,
  contactInfo?: string
): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseConfigured()) return { ok: false, error: "Supabase is not configured" };
  const supabase = getSupabase();
  const { error } = await supabase
    .from("students")
    .update({
      name,
      grade: grade ?? null,
      dob: dob ?? null,
      contact_info: contactInfo ?? null,
    })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/groups/${groupId}`);
  revalidatePath("/");
  return { ok: true };
}

export async function reorderStudents(
  updates: { id: string; sort_order: number }[]
): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseConfigured()) return { ok: false, error: "Supabase is not configured" };
  const supabase = getSupabase();
  const results = await Promise.all(
    updates.map((u) =>
      supabase.from("students").update({ sort_order: u.sort_order }).eq("id", u.id)
    )
  );
  const failed = results.find((r) => r.error);
  if (failed?.error) return { ok: false, error: failed.error.message };
  return { ok: true };
}
