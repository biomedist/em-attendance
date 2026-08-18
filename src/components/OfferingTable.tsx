"use client";

import type { MonthlyStat, GroupAttendanceStat } from "@/lib/data";
import { useState, useTransition } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { saveOffering } from "@/app/actions";
import { formatCurrency } from "@/lib/dates";

function AttendanceStatSection({
  yearlyStats,
  currentYear,
}: {
  yearlyStats: GroupAttendanceStat[];
  currentYear: number;
}) {
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  function toggleGroup(groupId: string) {
    setOpenGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  }

  function getColor(pct: number) {
    if (pct >= 80) return "text-emerald-600";
    if (pct >= 50) return "text-amber-500";
    return "text-red-500";
  }

  function getBar(pct: number) {
    if (pct >= 80) return "bg-emerald-400";
    if (pct >= 50) return "bg-amber-400";
    return "bg-red-400";
  }

  return (
    <div className="rounded-xl bg-white shadow-sm ring-1 ring-stone-200/60">
      <div className="border-b border-stone-100 px-4 py-3">
        <p className="text-sm font-semibold text-stone-700">
          {currentYear} Attendance Stats
        </p>
        <p className="text-xs text-stone-400">출석률 높은 순 · 그룹 클릭으로 펼치기</p>
      </div>

      <div className="divide-y divide-stone-100">
        {yearlyStats.map((group) => {
          const isOpen = openGroups[group.groupId] ?? false;
          const groupAvg =
            group.students.length > 0
              ? Math.round(
                  group.students.reduce((sum, s) => sum + s.percentage, 0) /
                    group.students.length
                )
              : 0;

          return (
            <div key={group.groupId}>
              <button
                type="button"
                onClick={() => toggleGroup(group.groupId)}
                className="flex w-full items-center justify-between px-4 py-3 hover:bg-stone-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-stone-700">
                    {group.groupName}
                  </span>
                  <span className="text-xs text-stone-400">
                    {group.students.length}명
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-bold ${getColor(groupAvg)}`}>
                    평균 {groupAvg}%
                  </span>
                  <svg
                    className={`h-4 w-4 text-stone-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
                    fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="m19 9-7 7-7-7" />
                  </svg>
                </div>
              </button>

              {isOpen && (
                <div className="px-4 pb-3">
                  {group.students.length === 0 ? (
                    <p className="text-xs text-stone-400">학생 없음</p>
                  ) : (
                    <ul className="space-y-2">
                      {group.students.map((student, index) => (
                        <li key={student.studentId} className="flex items-center gap-3">
                          <span className="w-5 text-center text-xs font-medium text-stone-400">
                            {index + 1}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="mb-1 flex items-center justify-between">
                              <span className="text-sm font-medium text-stone-700">
                                {student.name}
                              </span>
                              <span className={`text-xs font-bold ${getColor(student.percentage)}`}>
                                {student.presentCount}/{student.totalWeeks}
                                <span className="ml-1">({student.percentage}%)</span>
                              </span>
                            </div>
                            <div className="h-1.5 w-full rounded-full bg-stone-100">
                              <div
                                className={`h-1.5 rounded-full ${getBar(student.percentage)} transition-all`}
                                style={{ width: `${student.percentage}%` }}
                              />
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function OfferingTable({
  weekDate,
  initialAmount,
  summary,
  monthlyStats,
  yearlyStats,
  currentYear,
}: {
  weekDate: string;
  initialAmount: number;
  summary: {
    studentPresent: number;
    studentTotal: number;
    teacherPresent: number;
    teacherTotal: number;
  };
  monthlyStats: MonthlyStat[];
  yearlyStats: GroupAttendanceStat[];
  currentYear: number;
}) {
  const [amount, setAmount] = useState(initialAmount);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const totalPresent = summary.studentPresent + summary.teacherPresent;

  function handleSave() {
    startTransition(async () => {
      const result = await saveOffering(weekDate, amount);
      setMessage(result.ok ? "Saved!" : result.error ?? "Save failed");
    });
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-xl bg-white p-3 text-center shadow-sm ring-1 ring-stone-200/60">
          <p className="text-lg font-bold text-stone-800">
            {summary.studentPresent}
            <span className="text-xs font-normal text-stone-400">/{summary.studentTotal}</span>
          </p>
          <p className="text-[11px] text-stone-400">Students</p>
        </div>
        <div className="rounded-xl bg-white p-3 text-center shadow-sm ring-1 ring-stone-200/60">
          <p className="text-lg font-bold text-stone-800">
            {summary.teacherPresent}
            <span className="text-xs font-normal text-stone-400">/{summary.teacherTotal}</span>
          </p>
          <p className="text-[11px] text-stone-400">Teachers</p>
        </div>
        <div className="rounded-xl bg-white p-3 text-center shadow-sm ring-1 ring-stone-200/60">
          <p className="text-lg font-bold text-stone-800">{totalPresent}</p>
          <p className="text-[11px] text-stone-400">Total</p>
        </div>
      </div>

      <div className="rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 p-4 ring-1 ring-amber-200/60">
        <p className="text-xs font-medium uppercase tracking-wide text-amber-600/80">This Week</p>
        <div className="relative mt-2">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-amber-600">₩</span>
          <input
            type="number"
            value={amount}
            onChange={(e) => { setAmount(Number(e.target.value) || 0); setMessage(null); }}
            className="w-full rounded-lg border border-amber-200 bg-white py-2.5 pl-7 pr-3 text-lg font-bold text-amber-900 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
          />
        </div>
      </div>

      {message && (
        <p className={`text-center text-sm ${message === "Saved!" ? "text-emerald-600" : "text-red-600"}`}>
          {message}
        </p>
      )}

      <button
        type="button"
        onClick={handleSave}
        disabled={isPending}
        className="w-full rounded-xl bg-amber-600 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-amber-700 active:scale-[0.99] disabled:opacity-60"
      >
        {isPending ? "Saving…" : "Save Offering"}
      </button>

      <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-stone-200/60">
        <p className="mb-3 text-sm font-semibold text-stone-700">Last 12 Months</p>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={monthlyStats} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0eee9" />
            <XAxis dataKey="month" tick={{ fontSize: 10 }} tickFormatter={(m) => m.slice(5)} />
            <YAxis yAxisId="left" tick={{ fontSize: 10 }} tickFormatter={(v) => `${v}명`} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} tickFormatter={(v) => `${v / 10000}만`} />
            <Tooltip
              formatter={(value, name) => {
                const num = typeof value === "number" ? value : Number(value ?? 0);
                if (name === "Offering") return [`${formatCurrency(num)} (합계)`, "Offering"];
                return [`${num}명`, "주간 평균"];
              }}
            />
            <Legend />
            <Line yAxisId="left" type="monotone" dataKey="attendance" stroke="#f59e0b" strokeWidth={2} name="Avg Attendance" />
            <Line yAxisId="right" type="monotone" dataKey="offering" stroke="#0ea5e9" strokeWidth={2} name="Offering" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <AttendanceStatSection yearlyStats={yearlyStats} currentYear={currentYear} />
    </div>
  );
}
