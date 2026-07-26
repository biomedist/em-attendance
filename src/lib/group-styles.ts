import type { GroupId } from "./types";

export const GROUP_STYLES: Record<
  GroupId,
  { color: string; bgColor: string; borderColor: string }
> = {
  A: {
    color: "text-indigo-700",
    bgColor: "bg-indigo-50",
    borderColor: "border-indigo-200",
  },
  B: {
    color: "text-emerald-700",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-200",
  },
  C: {
    color: "text-amber-700",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
  },
  D: {
    color: "text-rose-700",
    bgColor: "bg-rose-50",
    borderColor: "border-rose-200",
  },
  E: {
    color: "text-sky-700",
    bgColor: "bg-sky-50",
    borderColor: "border-sky-200",
  },
  TEACHER: {
    color: "text-violet-700",
    bgColor: "bg-violet-50",
    borderColor: "border-violet-200",
  },
};

export function getGroupStyle(id: string) {
  return GROUP_STYLES[id as GroupId] ?? GROUP_STYLES.A;
}
