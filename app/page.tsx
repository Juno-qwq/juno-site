import { HeroMainCard } from "@/components/HeroMainCard"
import { Calendar } from "@/components/cards/Calendar"
import { CurrentlyLearning } from "@/components/cards/CurrentlyLearning"
import { NowPlaying } from "@/components/cards/NowPlaying"
import { RecentPosts } from "@/components/cards/RecentPosts"
import { SystemOverview } from "@/components/cards/SystemOverview"
import { getRecentPosts } from "@/lib/blog"

export default function DashboardPage() {
  // Same vault-backed source as /blog — top 3 by date.
  const recent = getRecentPosts(3)

  // A tight one-screen dashboard: hero + the System/Calendar rail on top, then a single row of
  // equal-height cards. Projects, the topics graph, reminders, and the newsletter live behind their
  // own sidebar tabs, so they're intentionally not duplicated here.
  return (
    <main id="main-content" className="px-4 pb-3 pt-14 lg:px-6 lg:pt-3">
      <div className="grid gap-3 xl:grid-cols-[1fr_320px]">
        <HeroMainCard />
        <div className="space-y-3">
          <SystemOverview />
          <Calendar />
        </div>
      </div>

      {/* Equal-height row (grid cells stretch to match). */}
      <div className="mt-3 grid gap-3 md:grid-cols-3">
        <RecentPosts posts={recent} />
        <CurrentlyLearning />
        <NowPlaying />
      </div>
    </main>
  )
}
