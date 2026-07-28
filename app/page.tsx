import { Footer } from "@/components/Footer"
import { HeroMainCard } from "@/components/HeroMainCard"
import { Calendar } from "@/components/cards/Calendar"
import { CurrentlyLearning } from "@/components/cards/CurrentlyLearning"
import { DailyReminder } from "@/components/cards/DailyReminder"
import { FeaturedProjects } from "@/components/cards/FeaturedProjects"
import { NowPlaying } from "@/components/cards/NowPlaying"
import { RecentPosts } from "@/components/cards/RecentPosts"
import { StayInLoop } from "@/components/cards/StayInLoop"
import { SystemOverview } from "@/components/cards/SystemOverview"
import { TopicsGraph } from "@/components/cards/TopicsGraph"
import { getRecentPosts } from "@/lib/blog"

export default function DashboardPage() {
  // Same vault-backed source as /blog — top 3 by date.
  const recent = getRecentPosts(3)

  return (
    <main id="main-content" className="px-4 pb-6 pt-16 lg:px-8 lg:pt-6">
      {/* Hero + main column, with the System/Calendar/NowPlaying rail on xl+. */}
        <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
          <div className="min-w-0 space-y-6">
            <HeroMainCard />
            <div className="grid gap-6 md:grid-cols-2">
              <RecentPosts posts={recent} />
              <CurrentlyLearning />
            </div>
            <FeaturedProjects />
          </div>
          <div className="space-y-6">
            <SystemOverview />
            <Calendar />
            <NowPlaying />
          </div>
        </div>

        {/* Graph + reminder + newsletter. */}
        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <TopicsGraph />
          <DailyReminder />
          <StayInLoop />
        </div>

      <Footer />
    </main>
  )
}
