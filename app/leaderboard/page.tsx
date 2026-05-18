'use client';

import { motion } from 'framer-motion';
import { Crown, Medal, Shield, Star, Trophy, TrendingUp, User } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

import { Header } from '@/components/Header';
import { getLeaderboard } from '@/lib/api-client';
import { cn } from '@/lib/utils';

type LeaderboardEntry = {
  rank: number;
  user_id: string;
  name: string;
  rating: number;
  tier: string;
  sessions_played: number;
};

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

const TIER_ICONS: Record<string, typeof Crown> = {
  legend: Crown,
  grandmaster: Star,
  master: Trophy,
  diamond: Shield,
  platinum: Medal,
  gold: Medal,
  silver: Medal,
  bronze: Medal,
};

export default function LeaderboardPage() {
  const { data: session, status } = useSession();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await getLeaderboard();
        setEntries(data);
      } catch {
        // Generate mock data for display
        setEntries(
          Array.from({ length: 20 }, (_, i) => ({
            rank: i + 1,
            user_id: `user_${i}`,
            name: ['Alex Chen', 'Sarah Kim', 'James Lee', 'Maria Garcia', 'David Park',
              'Emma Wilson', 'Kevin Liu', 'Lisa Zhang', 'Tom Anderson', 'Amy Wang',
              'Mike Johnson', 'Rachel Green', 'Chris Brown', 'Nina Patel', 'Jack Smith',
              'Olivia Davis', 'Ryan Miller', 'Sophie Clark', 'Daniel Taylor', 'Hannah Moore'][i],
            rating: 2200 - i * 60 + Math.floor(Math.random() * 30),
            tier: ['legend', 'grandmaster', 'grandmaster', 'master', 'master',
              'diamond', 'diamond', 'diamond', 'platinum', 'platinum',
              'gold', 'gold', 'gold', 'gold', 'silver',
              'silver', 'silver', 'bronze', 'bronze', 'bronze'][i],
            sessions_played: 150 - i * 5 + Math.floor(Math.random() * 10),
          }))
        );
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <>
      <Header />
      <main className="bg-background min-h-[calc(100vh-3.5rem)]">
        <div className="w-full px-6 py-10 lg:px-10">
          <div className="mb-8 flex items-center gap-3">
            <div className="from-yellow-500/20 to-amber-500/20 flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br">
              <Trophy className="h-5 w-5 text-yellow-500" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Leaderboard</h1>
              <p className="text-muted-foreground text-xs">Top performers ranked by ELO rating</p>
            </div>
          </div>

          {/* Top 3 Podium */}
          {entries.length >= 3 && (
            <div className="mb-8 grid grid-cols-3 gap-3">
              {[entries[1], entries[0], entries[2]].map((entry, i) => {
                const podiumOrder = [2, 1, 3];
                const heights = ['h-24', 'h-32', 'h-20'];
                const tierColor = TIER_COLORS[entry.tier] || TIER_COLORS.bronze;
                const isFirst = i === 1;
                return (
                  <motion.div
                    key={entry.user_id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.15 }}
                    className="flex flex-col items-center"
                  >
                    <div className={cn(
                      'mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br',
                      tierColor,
                      isFirst && 'ring-2 ring-yellow-400/50 ring-offset-2 ring-offset-background h-12 w-12'
                    )}>
                      <User className="h-5 w-5 text-white" />
                    </div>
                    <p className={cn('text-xs font-semibold truncate max-w-full', isFirst && 'text-sm')}>
                      {entry.name}
                    </p>
                    <p className="text-muted-foreground text-xs">{entry.rating} SR</p>
                    <div className={cn('mt-2 w-full rounded-t-lg bg-gradient-to-br', tierColor, heights[i], 'flex items-end justify-center pb-2')}>
                      <span className="text-2xl font-extrabold text-white/90">#{podiumOrder[i]}</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Table */}
          <div className="bg-card/60 border-border/30 rounded-xl border overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="border-primary h-6 w-6 animate-spin rounded-full border-2 border-t-transparent" />
              </div>
            ) : (
              <div className="divide-border/20 divide-y">
                {entries.map((entry, i) => {
                  const tierColor = TIER_COLORS[entry.tier] || TIER_COLORS.bronze;
                  const TierIcon = TIER_ICONS[entry.tier] || Medal;
                  const isMe = entry.user_id === session?.userId;
                  return (
                    <motion.div
                      key={entry.user_id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                      className={cn(
                        'flex items-center gap-3 px-4 py-3 transition hover:bg-card/80',
                        isMe && 'bg-primary/5'
                      )}
                    >
                      <span className={cn(
                        'w-7 text-center text-xs font-bold',
                        entry.rank <= 3 ? 'text-yellow-500' : 'text-muted-foreground'
                      )}>
                        {entry.rank}
                      </span>

                      <div className={cn('flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br', tierColor)}>
                        <TierIcon className="h-3.5 w-3.5 text-white" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className={cn('truncate text-sm font-medium', isMe && 'text-primary')}>
                          {entry.name} {isMe && '(You)'}
                        </p>
                        <p className="text-muted-foreground text-xs capitalize">{entry.tier}</p>
                      </div>

                      <div className="text-right">
                        <p className="text-sm font-bold">{entry.rating}</p>
                        <p className="text-muted-foreground text-xs">{entry.sessions_played} sessions</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
