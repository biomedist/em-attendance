import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { NoticeTimeline } from "@/components/NoticeTimeline";
import { SetupBanner } from "@/components/SetupBanner";
import { fetchNotices } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/supabase/client";

export default async function NoticePage() {
  const configured = isSupabaseConfigured();

  if (!configured) {
    return (
      <div className="flex min-h-full flex-col bg-stone-50">
        <AppHeader title="Notices" subtitle="Weekly events & announcements" />
        <SetupBanner />
        <BottomNav />
      </div>
    );
  }

  const notices = await fetchNotices();

  return (
    <div className="flex min-h-full flex-col bg-stone-50">
      <AppHeader title="Notices" subtitle="Weekly events & announcements" />
      <main className="mx-auto w-full max-w-lg flex-1 px-4 pb-28 pt-4">
        <NoticeTimeline notices={notices} />
      </main>
      <BottomNav />
    </div>
  );
}