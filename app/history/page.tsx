'use client';

import { motion } from 'framer-motion';
import {
  ArrowRight,
  Calendar,
  ChevronRight,
  Clock,
  History as HistoryIcon,
  Mic,
  Target,
  TrendingUp,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

import { Header } from '@/components/Header';
import { getSessionHistory } from '@/lib/api-client';
import { cn } from '@/lib/utils';

type SessionRecord = {
  session_id: string;
  mode: string;
  domain?: string;
  topic?: string;
  question_count: number;
  avg_score: number;
  rating_change: number;
  duration_seconds: number;
  created_at: string;
  status: string;
};

export default function HistoryPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await getSessionHistory();
        const raw = data.sessions || data || [];
        const mapped = raw.map((s: any) => ({
          session_id: s._id || s.session_id || '',
          mode: s.mode || 'practice',
          domain: s.domain || '',
          topic: s.domain || '',
          question_count: s.questions_answered || 0,
          avg_score: (s.total_score || 0) / 100,
          rating_change: s.rating_delta || 0,
          duration_seconds: s.duration_seconds || 0,
          created_at: s.started_at ? String(s.started_at) : '',
          status: s.status || 'completed',
        }));
        setSessions(mapped);
      } catch {
        setSessions([]);
      } finally {
        setLoading(false);
      }
    }
    if (status === 'authenticated') load();
  }, [status]);

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function formatDuration(s: number) {
    const min = Math.floor(s / 60);
    const sec = s % 60;
    return min > 0 ? `${min}m ${sec}s` : `${sec}s`;
  }

  function getScoreColor(score: number) {
    if (score >= 0.8) return 'text-green-400';
    if (score >= 0.6) return 'text-yellow-400';
    if (score >= 0.4) return 'text-orange-400';
    return 'text-red-400';
  }

  function getScoreBg(score: number) {
    if (score >= 0.8) return 'from-green-500/10 to-emerald-500/10 border-green-500/20';
    if (score >= 0.6) return 'from-yellow-500/10 to-amber-500/10 border-yellow-500/20';
    if (score >= 0.4) return 'from-orange-500/10 to-red-500/10 border-orange-500/20';
    return 'from-red-500/10 to-rose-500/10 border-red-500/20';
  }

  return (
    <>
      <Header />
      <main className="bg-background min-h-[calc(100vh-3.5rem)]">
        <div className="w-full px-6 py-10 lg:px-10">
          <div className="mb-8 flex items-center gap-3">
            <div className="from-indigo-500/20 to-violet-500/20 flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br">
              <HistoryIcon className="h-5 w-5 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Session History</h1>
              <p className="text-muted-foreground text-xs">
                Click any session to view detailed analytics
              </p>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="border-primary h-6 w-6 animate-spin rounded-full border-2 border-t-transparent" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-20">
              <Mic className="text-muted-foreground/20 mx-auto h-12 w-12" />
              <h3 className="mt-4 font-semibold">No sessions yet</h3>
              <p className="text-muted-foreground mt-1 text-sm">
                Start your first interview to see your history here.
              </p>
              <Link
                href="/interview"
                className="text-primary mt-4 inline-flex items-center gap-1 text-sm font-medium hover:underline"
              >
                Start an interview <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.map((s, i) => (
                <motion.div
                  key={s.session_id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => {
                    if (s.status === 'completed') {
                      router.push(`/analytics/${s.session_id}`);
                    }
                  }}
                  className={cn(
                    'group flex items-center gap-4 rounded-xl border p-4 transition',
                    s.status === 'completed'
                      ? 'bg-card/60 border-border/30 cursor-pointer hover:border-primary/30 hover:bg-card/80 hover:shadow-lg hover:shadow-primary/5'
                      : 'bg-card/30 border-border/20 opacity-60'
                  )}
                >
                  {/* Score Circle */}
                  <div className={cn('flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl border bg-gradient-to-br', getScoreBg(s.avg_score))}>
                    <p className={cn('text-xl font-extrabold leading-none', getScoreColor(s.avg_score))}>
                      {Math.round(s.avg_score * 100)}
                    </p>
                    <p className="text-muted-foreground text-[10px]">score</p>
                  </div>

                  {/* Details */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium capitalize">{s.mode} Mode</p>
                      {s.domain && (
                        <span className="bg-primary/10 text-primary truncate rounded px-1.5 py-0.5 text-xs">
                          {s.domain}
                        </span>
                      )}
                      {s.status !== 'completed' && (
                        <span className="rounded bg-yellow-500/10 px-1.5 py-0.5 text-xs text-yellow-400">
                          {s.status}
                        </span>
                      )}
                    </div>
                    <div className="text-muted-foreground mt-1 flex items-center gap-3 text-xs">
                      <span className="flex items-center gap-1">
                        <Target className="h-3 w-3" />
                        {s.question_count} questions
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDuration(s.duration_seconds)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(s.created_at)}
                      </span>
                    </div>
                  </div>

                  {/* Rating Change + Arrow */}
                  <div className="flex items-center gap-3 text-right">
                    <div>
                      <span
                        className={cn(
                          'inline-flex items-center gap-0.5 text-sm font-bold',
                          s.rating_change >= 0 ? 'text-green-400' : 'text-red-400'
                        )}
                      >
                        <TrendingUp className={cn('h-3.5 w-3.5', s.rating_change < 0 && 'rotate-180')} />
                        {s.rating_change >= 0 ? '+' : ''}{s.rating_change}
                      </span>
                      <p className="text-muted-foreground mt-0.5 text-xs">ELO</p>
                    </div>
                    {s.status === 'completed' && (
                      <ArrowRight className="h-4 w-4 text-muted-foreground/40 transition group-hover:text-primary group-hover:translate-x-0.5" />
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
