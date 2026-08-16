import { getGroupStyle } from "./group-styles";
import { getSupabase, isSupabaseConfigured } from "./supabase/client";
import type {
  AttendanceRecord,
  AttendanceStatus,
  Group,
  GroupId,
  Notice,
  Student,
  WeeklyOffering,
} from "./types";

export type MonthlyStat = {
  month: string;
  attendance: number;
  offering: number;
};

type DbGroup = {
  id: string;
  name: string;
  teacher: string | null;
  sort_order: number;
};

type DbStudent = {
  id: string;
  group_id: string;
  name: string;
  grade: string | null;
  dob: string | null;
  contact_info: string | null;
  sort_order: number;
};

type DbNotice = {
  id: string;
  date: string;
  title: string;
  description: string | null;
  type: "event" | "announcement" | "holiday";
};

type DbOffering = {
  group_id: string;
  amount: number;
  note: string | null;
};

type DbAttendance = {
  student_id: string;
  status: AttendanceStatus;
};

function toGroup(row: DbGroup, studentCount: number): Group {
  const style = getGroupStyle(row.id);
  const isTeacherGroup = row.id === "TEACHER";
  return {
    id: row.id as GroupId,
    name: row.name,
    teacher: row.teacher,
    studentCount,
    badgeLabel: isTeacherGroup ? "T" : row.id,
    memberLabel: isTeacherGroup ? "teachers" : "students",
    ...style,
  };
}

function toStudent(row: DbStudent): Student {
  return {
    id: row.id,
    groupId: row.group_id as GroupId,
    name: row.name,
    grade: row.grade,
    dob: row.dob,
    contactInfo: row.contact_info,
  };
}

function toNotice(row: DbNotice): Notice {
  return {
    id: row.id,
    date: row.date,
    title: row.title,
    description: row.description,
    type: row.type,
  };
}

export async function fetchGroups(): Promise<Group[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = getSupabase();

  const [{ data: groups, error: groupsError }, { data: students, error: studentsError }] =
    await Promise.all([
      supabase.from("groups").select("*").order("sort_order"),
      supabase.from("students").select("group_id").eq("active", true),
    ]);

  if (groupsError) throw groupsError;
  if (studentsError) throw studentsError;

  const counts = (students ?? []).reduce<Record<string, number>>((acc, s) => {
    acc[s.group_id] = (acc[s.group_id] ?? 0) + 1;
    return acc;
  }, {});

  return (groups as DbGroup[]).map((g) => toGroup(g, counts[g.id] ?? 0));
}

export async function fetchGroupById(groupId: string): Promise<Group | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = getSupabase();

  const [{ data: groupRow, error: groupError }, { data: students, error: studentsError }] =
    await Promise.all([
      supabase.from("groups").select("*").eq("id", groupId).single(),
      supabase.from("students").select("group_id").eq("group_id", groupId).eq("active", true),
    ]);

  if (groupError || !groupRow) return null;
  if (studentsError) throw studentsError;

  return toGroup(groupRow as DbGroup, (students ?? []).length);
}



export async function fetchStudentsByGroup(groupId: string): Promise<Student[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("students")
    .select("*")
    .eq("group_id", groupId)
    .eq("active", true)
    .order("sort_order");

  if (error) throw error;
  return (data as DbStudent[]).map(toStudent);
}

export async function fetchAttendanceForWeek(
  weekDate: string,
  studentIds: string[]
): Promise<AttendanceRecord[]> {
  if (!isSupabaseConfigured() || studentIds.length === 0) return [];

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("attendance_records")
    .select("student_id, status")
    .eq("week_date", weekDate)
    .in("student_id", studentIds);

  if (error) throw error;

  return (data as DbAttendance[]).map((r) => ({
    studentId: r.student_id,
    status: r.status,
  }));
}

export async function fetchOfferingForWeek(
  weekDate: string
): Promise<{ amount: number; note: string | null } | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("offerings")
    .select("amount, note")
    .eq("week_date", weekDate)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function fetchNotices(): Promise<Notice[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("notices")
    .select("*")
    .order("date");

  if (error) throw error;
  return (data as DbNotice[]).map(toNotice);
}

export async function fetchAttendanceSummaryForWeek(weekDate: string): Promise<{
  studentPresent: number;
  studentTotal: number;
  teacherPresent: number;
  teacherTotal: number;
}> {
  if (!isSupabaseConfigured()) {
    return { studentPresent: 0, studentTotal: 0, teacherPresent: 0, teacherTotal: 0 };
  }
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("attendance_records")
    .select("member_type, status")
    .eq("week_date", weekDate);
  if (error) throw error;

  let studentPresent = 0, studentTotal = 0, teacherPresent = 0, teacherTotal = 0;
  (data ?? []).forEach((r) => {
    if (r.member_type === "teacher") {
      teacherTotal++;
      if (r.status === "present") teacherPresent++;
    } else {
      studentTotal++;
      if (r.status === "present") studentPresent++;
    }
  });
  return { studentPresent, studentTotal, teacherPresent, teacherTotal };
}

export async function fetchMonthlyStats(): Promise<MonthlyStat[]> {

  if (!isSupabaseConfigured()) return [];
  const supabase = getSupabase();

  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth() - 11, 1);
  const startStr = start.toISOString().slice(0, 10);

  const [{ data: records, error: recError }, { data: offerings, error: offError }] =
    await Promise.all([
      supabase
        .from("attendance_records")
        .select("week_date, status")
        .eq("status", "present")
        .gte("week_date", startStr),
      supabase.from("offerings").select("week_date, amount").gte("week_date", startStr),
    ]);

  if (recError) throw recError;
  if (offError) throw offError;

  const months: string[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }

  const attendanceByMonth: Record<string, number> = {};
  (records ?? []).forEach((r) => {
    const key = r.week_date.slice(0, 7);
    attendanceByMonth[key] = (attendanceByMonth[key] ?? 0) + 1;
  });

  const offeringByMonth: Record<string, number> = {};
  (offerings ?? []).forEach((o) => {
    const key = o.week_date.slice(0, 7);
    offeringByMonth[key] = (offeringByMonth[key] ?? 0) + o.amount;
  });

  return months.map((m) => ({
    month: m,
    attendance: attendanceByMonth[m] ?? 0,
    offering: offeringByMonth[m] ?? 0,
  }));
}


export type StudentAttendanceStat = {
  studentId: string;
  name: string;
  groupId: string;
  presentCount: number;
  totalWeeks: number;
  percentage: number;
};

export type GroupAttendanceStat = {
  groupId: string;
  groupName: string;
  students: StudentAttendanceStat[];
};

export async function fetchYearlyAttendanceStats(
  year: number
): Promise<GroupAttendanceStat[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = getSupabase();

  const startDate = `${year}-01-01`;
  const endDate = `${year}-12-31`;

  const [
    { data: groups, error: groupsError },
    { data: students, error: studentsError },
    { data: records, error: recordsError },
  ] = await Promise.all([
    supabase.from("groups").select("id, name").order("sort_order"),
    supabase.from("students").select("id, name, group_id").eq("active", true),
    supabase
      .from("attendance_records")
      .select("student_id, week_date, status")
      .gte("week_date", startDate)
      .lte("week_date", endDate),
  ]);

  if (groupsError) throw groupsError;
  if (studentsError) throw studentsError;
  if (recordsError) throw recordsError;

  // 전체 주차 수 계산 (해당 연도에 기록된 고유 week_date 개수)
  const allWeeks = new Set((records ?? []).map((r) => r.week_date));
  const totalWeeks = allWeeks.size;

  // 학생별 출석 횟수
  const presentByStudent: Record<string, number> = {};
  (records ?? []).forEach((r) => {
    if (r.status === "present") {
      presentByStudent[r.student_id] = (presentByStudent[r.student_id] ?? 0) + 1;
    }
  });

  // 그룹별로 묶기 (TEACHER 제외)
  return (groups ?? [])
    .filter((g) => g.id !== "TEACHER")
    .map((g) => {
      const groupStudents = (students ?? [])
        .filter((s) => s.group_id === g.id)
        .map((s) => {
          const presentCount = presentByStudent[s.id] ?? 0;
          const percentage =
            totalWeeks > 0 ? Math.round((presentCount / totalWeeks) * 100) : 0;
          return {studentId: s.id,
            name: s.name,
            groupId: g.id,
            presentCount,
            totalWeeks,
            percentage,
          };
        })
        .sort((a, b) => b.percentage - a.percentage);

      return {
        groupId: g.id,
        groupName: g.name,
        students: groupStudents,
      };
    });
}

export async function updateStudentSortOrder(
  updates: { id: string; sort_order: number }[]
): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseConfigured()) return { ok: false, error: "Not configured" };
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
