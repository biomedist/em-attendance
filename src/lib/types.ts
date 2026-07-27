export type GroupId = "A" | "B" | "C" | "D" | "E" | "TEACHER";
export type AttendanceStatus = "present" | "absent";

export interface Group {
  id: GroupId;
  name: string;
  teacher: string | null;
  studentCount: number;
  badgeLabel: string;
  memberLabel: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

export interface Student {
  id: string;
  groupId: GroupId;
  name: string;
  grade: string | null;
  dob: string | null;
  contactInfo: string | null;
}

export interface AttendanceRecord {
  studentId: string;
  status: AttendanceStatus;
}

export interface WeeklyOffering {
  amount: number;
  note: string | null;
}

export interface Notice {
  id: string;
  date: string;
  title: string;
  description: string | null;
  type: "event" | "announcement" | "holiday";
}
