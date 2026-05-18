'use client';

import { DailyActivityCard } from '@/components/dashboard/activity';
import Hero from '@/components/dashboard/hero/Hero';
import { buildHeroProperties } from '@/components/dashboard/hero/hero.utilities';
import { PracticeCard } from '@/components/dashboard/practice/PracticeCard';
import RecentTopicsCard, { RecentTopics } from '@/components/dashboard/RecentTopicsCard';
import StreakCard from '@/components/dashboard/streak/StreakCard';
import { Tip } from '@/components/dashboard/tip/tip.types';
import { TipCard } from '@/components/dashboard/tip/TipCard';
import { DashboardStats } from '@/data/dashboard.api';
import { useTranslation } from '@/hooks/use-translation';
import { useAuth } from '@/providers/auth-state.provider';
import { LanguageCode } from '@/services/locale/locale.service';

type DashboardProperties = {
  randomTip: Tip;
  dashboardStats: DashboardStats;
  inProgressTopics: RecentTopics[];
  languageCode: LanguageCode;
};

export function DashboardContent({ randomTip, dashboardStats, inProgressTopics, languageCode }: DashboardProperties) {
  const { t } = useTranslation();
  const { user } = useAuth();

  return (
    <main className="text-foreground py-8">
      <section className="grid w-full gap-10 px-6 lg:px-10">
        <Hero
          {...buildHeroProperties(t, languageCode, user?.username ?? 'Guest', {
            todayAnswers: dashboardStats.todayAnswers,
            totalAnswers: dashboardStats.totalAnswers,
            streak: dashboardStats.streak,
          })}
        />

        <article className="space-y-6">
          <section className="grid grid-cols-1 items-stretch gap-6 sm:grid-cols-2 lg:grid-cols-7">
            <div className="lg:col-span-2">
              <PracticeCard
                correctAnswers={dashboardStats.correctAnswers}
                totalAnswers={dashboardStats.totalAnswers}
                accuracy={dashboardStats.accuracy}
                totalDays={dashboardStats.totalDays}
              />
            </div>
            <div className="lg:col-span-2">
              <StreakCard streak={dashboardStats.streak} bestStreak={dashboardStats.bestStreak} />
            </div>
            <div className="sm:col-span-2 md:col-span-2 lg:col-span-3">
              <DailyActivityCard days={dashboardStats.days} />
            </div>
          </section>
          <section className="grid gap-6 md:grid-cols-2 lg:col-span-3">
            <RecentTopicsCard topics={inProgressTopics} />
            <TipCard tip={randomTip} />
          </section>
        </article>
      </section>
    </main>
  );
}
