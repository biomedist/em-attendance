import Link from "next/link";

export function SetupBanner() {
  return (
    <div className="mx-4 mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
      <p className="font-semibold">Setup required</p>
      <ol className="mt-2 list-decimal space-y-1 pl-4 text-amber-800">
        <li>
          Add your <code className="rounded bg-amber-100 px-1">anon key</code> to{" "}
          <code className="rounded bg-amber-100 px-1">.env.local</code> (Supabase →
          Settings → API)
        </li>
        <li>
          Run{" "}
          <code className="rounded bg-amber-100 px-1">supabase/schema.sql</code> in
          the SQL Editor
        </li>
      </ol>
      <Link
        href="https://supabase.com/dashboard/project/wiwuatjbilylliinzruq/settings/api"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-block font-medium text-amber-700 underline"
      >
        Open Supabase API settings →
      </Link>
    </div>
  );
}
