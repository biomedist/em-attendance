import Link from "next/link";

export function AppHeader({
  title,
  subtitle,
  backHref,
}: {
  title: string;
  subtitle?: string;
  backHref?: string;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-stone-200/80 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-lg items-center gap-3 px-4 py-4">
        {backHref && (
          <Link
            href={backHref}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-800"
            aria-label="Go back"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 19.5 8.25 12l7.5-7.5"
              />
            </svg>
          </Link>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wider text-stone-400">
            EM Children
          </p>
          <h1 className="truncate text-lg font-semibold text-stone-900">
            {title}
          </h1>
          {subtitle && (
            <p className="truncate text-sm text-stone-500">{subtitle}</p>
          )}
        </div>
      </div>
    </header>
  );
}
