'use client';

import { motion } from 'framer-motion';
import {
  ArrowRight,
  BarChart3,
  Brain,
  ChevronRight,
  Clock,
  Flame,
  Mic,
  Shield,
  Star,
  Target,
  TrendingUp,
  Trophy,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { getDashboardData } from '@/lib/api-client';
import { Routes } from '@/lib/routes';
import { cn } from '@/lib/utils';

// ── Badge Catalogue (mirrors server/models/badge.py) ──
const BADGE_CATALOG: Record<string, { name: string; icon: string; description: string; rarity: string }> = {
  first_session:  { name: 'First Steps',      icon: '🎯', description: 'Complete your first session', rarity: 'common' },
  five_sessions:  { name: 'On a Roll',        icon: '🔥', description: 'Complete 5 sessions', rarity: 'uncommon' },
  ten_sessions:   { name: 'Committed',         icon: '💪', description: 'Complete 10 sessions', rarity: 'rare' },
  streak_3:       { name: 'Streak Starter',    icon: '⚡', description: '3-day streak', rarity: 'uncommon' },
  streak_7:       { name: 'Week Warrior',      icon: '🗓️', description: '7-day streak', rarity: 'rare' },
  perfect_score:  { name: 'Flawless',          icon: '💎', description: 'Score 95%+ in a session', rarity: 'legendary' },
  rating_1500:    { name: 'Developer',         icon: '💻', description: 'Reach 1500 rating', rarity: 'rare' },
  rating_2000:    { name: 'Senior',            icon: '🚀', description: 'Reach 2000 rating', rarity: 'legendary' },
  top_keyword:    { name: 'Keyword King',      icon: '🔑', description: '85%+ keyword coverage', rarity: 'epic' },
  closure_master: { name: 'Closure Master',    icon: '🔒', description: '80%+ on closures', rarity: 'epic' },
  async_expert:   { name: 'Async Expert',      icon: '⏳', description: '80%+ on async', rarity: 'epic' },
  consistent:     { name: 'Consistent Coder',  icon: '📈', description: '5 sessions at 60%+', rarity: 'rare' },
  comeback:       { name: 'Comeback Kid',      icon: '🔄', description: 'Rating +200 from low', rarity: 'epic' },
};

const RARITY_STYLES: Record<string, { border: string; glow: string; bg: string; text: string }> = {
  common:    { border: 'border-zinc-500/40', glow: 'shadow-zinc-500/20', bg: 'from-zinc-700/30 to-zinc-800/30', text: 'text-zinc-300' },
  uncommon:  { border: 'border-green-500/40', glow: 'shadow-green-500/20', bg: 'from-green-900/30 to-emerald-900/30', text: 'text-green-300' },
  rare:      { border: 'border-blue-500/40', glow: 'shadow-blue-500/25', bg: 'from-blue-900/30 to-indigo-900/30', text: 'text-blue-300' },
  epic:      { border: 'border-purple-500/40', glow: 'shadow-purple-500/30', bg: 'from-purple-900/30 to-violet-900/30', text: 'text-purple-300' },
  legendary: { border: 'border-yellow-400/50', glow: 'shadow-yellow-400/30', bg: 'from-yellow-900/30 to-amber-900/30', text: 'text-yellow-300' },
};

type DashboardData = {
  rating: number;
  tier: string;
  total_sessions: number;
  avg_score: number;
  streak: number;
  best_streak: number;
  topics_mastered: number;
  total_questions: number;
  badges: string[];
  recent_sessions: Array<{
    session_id: string;
    mode: string;
    avg_score: number;
    created_at: string;
    rating_change: number;
    domain: string;
  }>;
  topic_scores: Array<{
    topic: string;
    avg_score: number;
    attempts: number;
  }>;
};

function mapBackendToDashboard(raw: any): DashboardData {
  const r = raw.rating || {};
  const s = raw.stats || {};
  const sessions = (raw.recent_sessions || []).map((rs: any) => ({
    session_id: rs.id || '',
    mode: rs.mode || 'practice',
    avg_score: (rs.total_score || 0) / 100,
    created_at: rs.started_at || '',
    rating_change: rs.rating_delta || 0,
    domain: rs.domain || '',
  }));

  return {
    rating: r.current || 1200,
    tier: (r.tier || 'bronze').toLowerCase(),
    total_sessions: s.total_sessions || 0,
    avg_score: s.avg_score || 0,
    streak: r.streak_current || 0,
    best_streak: r.streak_best || 0,
    topics_mastered: s.topics_mastered || 0,
    total_questions: s.total_questions || 0,
    badges: r.badges || [],
    recent_sessions: sessions,
    topic_scores: [],
  };
}

const TIER_COLORS: Record<string, string> = {
  legend: 'from-yellow-400 to-amber-500',
  grandmaster: 'from-red-400 to-rose-500',
  master: 'from-purple-400 to-violet-500',
  diamond: 'from-blue-400 to-cyan-500',
  platinum: 'from-teal-400 to-emerald-500',
  gold: 'from-yellow-500 to-orange-500',
  silver: 'from-gray-300 to-gray-400',
  bronze: 'from-orange-700 to-amber-800',
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4 },
  }),
};

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push(Routes.SignIn);
      return;
    }
    if (status !== 'authenticated') return;

    async function checkOnboardingAndLoad() {
      if (session && !(session as any).onboardingComplete) {
        try {
          const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';
          const res = await fetch(`${backendUrl}/api/profile`, {
            headers: {
              Authorization: `Bearer ${(session as any).accessToken}`,
            },
          });
          if (res.ok) {
            const profile = await res.json();
            if (!profile.onboarding_complete) {
              router.push('/onboard');
              return;
            }
          } else {
            router.push('/onboard');
            return;
          }
        } catch {
          router.push('/onboard');
          return;
        }
      }

      try {
        const raw = await getDashboardData();
        setData(mapBackendToDashboard(raw));
      } catch {
        setData({
          rating: 1200,
          tier: 'bronze',
          total_sessions: 0,
          avg_score: 0,
          streak: 0,
          best_streak: 0,
          topics_mastered: 0,
          total_questions: 0,
          badges: [],
          recent_sessions: [],
          topic_scores: [],
        });
      } finally {
        setLoading(false);
      }
    }
    checkOnboardingAndLoad();
  }, [status, session, router]);

  if (loading || !data) {
    return (
      <>
        <Header />
        <main className="bg-background flex min-h-[calc(100vh-3.5rem)] items-center justify-center">
          <div className="border-primary h-6 w-6 animate-spin rounded-full border-2 border-t-transparent" />
        </main>
      </>
    );
  }

  const tierColor = TIER_COLORS[data.tier] || TIER_COLORS.bronze;

  function getScoreColor(score: number) {
    if (score >= 0.8) return 'text-green-400';
    if (score >= 0.6) return 'text-yellow-400';
    if (score >= 0.4) return 'text-orange-400';
    return 'text-red-400';
  }

  return (
    <>
      <Header />
      {/* Shiny badge keyframes */}
      <style jsx global>{`
        @keyframes badge-shine {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .badge-shine {
          background-size: 200% auto;
          animation: badge-shine 3s linear infinite;
        }
        @keyframes badge-glow {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
        .badge-glow {
          animation: badge-glow 2s ease-in-out infinite;
        }
        @keyframes badge-float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-2px); }
        }
        .badge-float {
          animation: badge-float 3s ease-in-out infinite;
        }
      `}</style>
      <main className="bg-background min-h-[calc(100vh-3.5rem)]">
        <div className="w-full px-6 py-8 lg:px-10">
          {/* Welcome */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold">
              Welcome back,{' '}
              <span className="from-primary to-accent bg-gradient-to-r bg-clip-text text-transparent">
                {session?.user?.name || 'User'}
              </span>
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Here&apos;s your training overview. Keep the streak alive!
            </p>
          </div>

          {/* Stats Row */}
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
            <motion.div
              custom={0}
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              className="bg-card/60 border-border/30 col-span-2 flex items-center gap-4 rounded-xl border p-5 sm:col-span-1 lg:col-span-1"
            >
              <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br', tierColor)}>
                <Trophy className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-extrabold">{data.rating}</p>
                <p className="text-muted-foreground text-xs capitalize">{data.tier} Tier</p>
              </div>
            </motion.div>

            {[
              { icon: Target, value: data.total_sessions, label: 'Sessions', color: 'from-blue-500/20 to-cyan-500/20', iconColor: 'text-blue-400' },
              { icon: Brain, value: `${Math.round(data.avg_score * 100)}%`, label: 'Avg Score', color: 'from-purple-500/20 to-pink-500/20', iconColor: 'text-purple-400' },
              { icon: Flame, value: data.streak, label: 'Streak', color: 'from-orange-500/20 to-red-500/20', iconColor: 'text-orange-400' },
              { icon: Star, value: data.topics_mastered, label: 'Topics Mastered', color: 'from-yellow-500/20 to-amber-500/20', iconColor: 'text-yellow-400' },
            ].map((stat, i) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  custom={i + 1}
                  initial="hidden"
                  animate="visible"
                  variants={fadeUp}
                  className="bg-card/60 border-border/30 rounded-xl border p-4"
                >
                  <div className={cn('mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br', stat.color)}>
                    <Icon className={cn('h-4 w-4', stat.iconColor)} />
                  </div>
                  <p className="text-lg font-bold">{stat.value}</p>
                  <p className="text-muted-foreground text-xs">{stat.label}</p>
                </motion.div>
              );
            })}
          </div>

          {/* Main Grid */}
          <div className="grid gap-5 lg:grid-cols-3">
            {/* Left */}
            <div className="space-y-5 lg:col-span-2">
              {/* Quick Start */}
              <motion.div custom={5} initial="hidden" animate="visible" variants={fadeUp} className="bg-card/60 border-border/30 rounded-xl border p-5">
                <h2 className="mb-3 text-sm font-semibold">Quick Start</h2>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {[
                    { label: 'Mock Interview', desc: "10 Q's, full scoring", icon: Mic, color: 'from-blue-500 to-cyan-500', href: Routes.Interview },
                    { label: 'Practice Mode', desc: "5 Q's, relaxed pace", icon: Target, color: 'from-green-500 to-emerald-500', href: Routes.Interview },
                    { label: 'Speed Round', desc: "15 Q's, 60s each", icon: Zap, color: 'from-orange-500 to-amber-500', href: Routes.Interview },
                  ].map((action) => {
                    const Icon = action.icon;
                    return (
                      <Link key={action.label} href={action.href} className="group bg-background/50 hover:bg-background/80 flex items-center gap-3 rounded-lg border border-border/20 p-3 transition hover:border-primary/20">
                        <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br', action.color)}>
                          <Icon className="h-4 w-4 text-white" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold">{action.label}</p>
                          <p className="text-muted-foreground text-xs">{action.desc}</p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </motion.div>

              {/* Recent Sessions — clickable to analytics */}
              <motion.div custom={6} initial="hidden" animate="visible" variants={fadeUp} className="bg-card/60 border-border/30 rounded-xl border p-5">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-sm font-semibold">Recent Sessions</h2>
                  <Link href={Routes.History} className="text-primary flex items-center gap-1 text-xs hover:underline">
                    View all <ChevronRight className="h-3 w-3" />
                  </Link>
                </div>
                {data.recent_sessions.length === 0 ? (
                  <div className="py-6 text-center">
                    <Mic className="text-muted-foreground/20 mx-auto h-8 w-8" />
                    <p className="text-muted-foreground mt-2 text-xs">No sessions yet</p>
                    <Button asChild size="sm" variant="outline" className="mt-3">
                      <Link href={Routes.Interview}>Start your first</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="divide-border/15 divide-y">
                    {data.recent_sessions.slice(0, 5).map((s) => (
                      <div
                        key={s.session_id}
                        onClick={() => router.push(`/analytics/${s.session_id}`)}
                        className="group flex cursor-pointer items-center gap-3 py-2.5 transition hover:bg-background/30 rounded-md px-1 -mx-1"
                      >
                        <p className={cn('text-lg font-bold', getScoreColor(s.avg_score))}>
                          {Math.round(s.avg_score * 100)}
                        </p>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-medium capitalize">{s.mode} {s.domain && `• ${s.domain}`}</p>
                          <p className="text-muted-foreground text-xs">
                            {new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </p>
                        </div>
                        <span className={cn('text-xs font-bold', s.rating_change >= 0 ? 'text-green-400' : 'text-red-400')}>
                          {s.rating_change >= 0 ? '+' : ''}{s.rating_change}
                        </span>
                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/30 transition group-hover:text-primary" />
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            </div>

            {/* Right Sidebar */}
            <div className="space-y-5">
              {/* Streak Card */}
              <motion.div custom={7} initial="hidden" animate="visible" variants={fadeUp} className="bg-card/60 border-border/30 rounded-xl border p-5">
                <div className="mb-3 flex items-center gap-2">
                  <Flame className="h-4 w-4 text-orange-400" />
                  <h3 className="text-sm font-semibold">Streak</h3>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-orange-400">{data.streak}</span>
                  <span className="text-muted-foreground text-xs">days</span>
                </div>
                <p className="text-muted-foreground mt-1 text-xs">Best: {data.best_streak} days</p>
                <div className="bg-border/20 mt-3 h-1.5 rounded-full">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-orange-500 to-red-500 transition-all"
                    style={{ width: `${Math.min((data.streak / Math.max(data.best_streak, 1)) * 100, 100)}%` }}
                  />
                </div>
              </motion.div>

              {/* Shiny Badges */}
              <motion.div custom={8} initial="hidden" animate="visible" variants={fadeUp} className="bg-card/60 border-border/30 rounded-xl border p-5">
                <div className="mb-4 flex items-center gap-2">
                  <Shield className="h-4 w-4 text-yellow-400" />
                  <h3 className="text-sm font-semibold">Badges</h3>
                  {data.badges.length > 0 && (
                    <span className="ml-auto rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
                      {data.badges.length}
                    </span>
                  )}
                </div>
                {data.badges.length === 0 ? (
                  <div className="py-4 text-center">
                    <div className="mx-auto mb-2 text-3xl opacity-30">🏆</div>
                    <p className="text-muted-foreground/50 text-xs italic">
                      Complete sessions to earn badges
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {data.badges.map((badgeId, i) => {
                      const badge = BADGE_CATALOG[badgeId];
                      if (!badge) return null;
                      const rarity = RARITY_STYLES[badge.rarity] || RARITY_STYLES.common;
                      return (
                        <motion.div
                          key={badgeId}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.1, type: 'spring' }}
                          className={cn(
                            'badge-float group relative overflow-hidden rounded-lg border p-3 transition-all hover:scale-105',
                            rarity.border,
                            `bg-gradient-to-br ${rarity.bg}`,
                            `shadow-lg ${rarity.glow}`
                          )}
                          style={{ animationDelay: `${i * 0.4}s` }}
                        >
                          {/* Shine overlay */}
                          <div
                            className="badge-shine pointer-events-none absolute inset-0 opacity-20"
                            style={{
                              background: `linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.3) 50%, transparent 70%)`,
                              backgroundSize: '200% 100%',
                            }}
                          />
                          {/* Glow border */}
                          <div className={cn('badge-glow pointer-events-none absolute -inset-px rounded-lg border', rarity.border)} />
                          <div className="relative">
                            <div className="mb-1 text-2xl">{badge.icon}</div>
                            <p className={cn('text-xs font-bold leading-tight', rarity.text)}>
                              {badge.name}
                            </p>
                            <p className="text-muted-foreground mt-0.5 text-[10px] leading-tight">
                              {badge.description}
                            </p>
                            <span className={cn('mt-1 inline-block rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider', rarity.text)} style={{ background: 'rgba(255,255,255,0.05)' }}>
                              {badge.rarity}
                            </span>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
                {/* Locked badges preview */}
                {data.badges.length > 0 && data.badges.length < Object.keys(BADGE_CATALOG).length && (
                  <div className="mt-3 border-t border-border/20 pt-3">
                    <p className="text-muted-foreground mb-2 text-[10px] uppercase tracking-wider">Locked</p>
                    <div className="flex flex-wrap gap-1.5">
                      {Object.entries(BADGE_CATALOG)
                        .filter(([id]) => !data.badges.includes(id))
                        .slice(0, 6)
                        .map(([id, badge]) => (
                          <div
                            key={id}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/10 bg-background/30 text-base opacity-30 grayscale transition hover:opacity-60"
                            title={`${badge.name}: ${badge.description}`}
                          >
                            {badge.icon}
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </motion.div>

              {/* Leaderboard CTA */}
              <motion.div custom={9} initial="hidden" animate="visible" variants={fadeUp}>
                <Link href={Routes.Leaderboard} className="bg-card/60 border-border/30 group flex items-center gap-3 rounded-xl border p-4 transition hover:border-primary/30">
                  <div className="from-yellow-500/20 to-amber-500/20 flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br">
                    <Trophy className="h-4 w-4 text-yellow-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold">Leaderboard</p>
                    <p className="text-muted-foreground text-xs">See how you rank</p>
                  </div>
                  <ChevronRight className="text-muted-foreground h-4 w-4 transition group-hover:text-primary" />
                </Link>
              </motion.div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
