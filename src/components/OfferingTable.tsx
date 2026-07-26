"use client";

import type { MonthlyStat } from "@/lib/data";
import { useState, useTransition } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { saveOffering } from "@/app/actions";
import { formatCurrency } from "@/lib/dates";

export function OfferingTable({
  weekDate,
  initialAmount,
  summary,
  monthlyStats,
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
    <div>
      <div className="mb-4 grid grid-cols-3 gap-2">
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

      <div className="mb-4 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 p-4 ring-1 ring-amber-200/60">
        <p className="text-xs font-medium uppercase tracking-wide text-amber-600/80">This Week</p>
        <div className="relative mt-2">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-amber-600">₩</span>
          <input
            type="number"
            value={amount}
            onChange={(e) => {
              setAmount(Number(e.target.value) || 0);
              setMessage(null);
            }}
            className="w-full rounded-lg border border-amber-200 bg-white py-2.5 pl-7 pr-3 text-lg font-bold text-amber-900 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
          />
        </div>
      </div>

      {message && (
        <p className={`mb-3 text-center text-sm ${message === "Saved!" ? "text-emerald-600" : "text-red-600"}`}>
          {message}
        </p>
      )}

      <button
        type="button"
        onClick={handleSave}
        disabled={isPending}
        className="mb-6 w-full rounded-xl bg-amber-600 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-amber-700 active:scale-[0.99] disabled:opacity-60"
      >
        {isPending ? "Saving…" : "Save Offering"}
      </button>

      <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-stone-200/60">
        <p className="mb-3 text-sm font-semibold text-stone-700">Last 12 Months</p>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={monthlyStats} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0eee9" />
            <XAxis dataKey="month" tick={{ fontSize: 10 }} tickFormatter={(m) => m.slice(5)} />
            <YAxis yAxisId="left" tick={{ fontSize: 10 }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} tickFormatter={(v) => `${v / 10000}만`} />
            <Tooltip
              formatter={(value, name) => {
                const num = typeof value === "number" ? value : Number(value ?? 0);
                return name === "offering" ? [formatCurrency(num), "Offering"] : [num, "Attendance"];
              }}
            />
            <Legend />
            <Line yAxisId="left" type="monotone" dataKey="attendance" stroke="#f59e0b" strokeWidth={2} name="Attendance" />
            <Line yAxisId="right" type="monotone" dataKey="offering" stroke="#0ea5e9" strokeWidth={2} name="Offering" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}