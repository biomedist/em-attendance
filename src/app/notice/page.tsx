import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { NoticeTimeline } from "@/components/NoticeTimeline";
import { SetupBanner } from "@/components/SetupBanner";
import { fetchNotices } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import type { Notice } from "@/lib/types";

export default async function NoticePage() {
  const configured = isSupabaseConfigured();
  let notices: Notice[] = [];

  if (configured) {
    try {
      notices = await fetchNotices();
    } catch {
      notices = [];
    }
  }

  return (
    <div className="flex min-h-full flex-col bg-stone-50">
      <AppHeader title="Notice" subtitle="Weekly events & announcements" />

      {!configured && <SetupBanner />}

      <main className="mx-auto w-full max-w-lg flex-1 px-4 pb-28 pt-4">
        <p className="mb-4 text-sm text-stone-500">
          Record special services, events, and holidays by week.
        </p>
        <NoticeTimeline notices={notices} />
      </main>

      <BottomNav />
    </div>
  );
}
