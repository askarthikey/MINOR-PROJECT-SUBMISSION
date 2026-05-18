'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  BarChart3,
  Brain,
  Calendar,
  CheckCircle,
  ChevronDown,
  Clock,
  Flame,
  Mic,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { Header } from '@/components/Header';
import { getSessionDetail } from '@/lib/api-client';
import { cn } from '@/lib/utils';

type AttemptData = {
  _id: string;
  question_id: string;
  question_text: string;
  user_answer_transcript: string;
  scores: {
    composite: number;
    keyword_coverage: number;
    semantic_similarity: number;
    cross_encoder_score: number;
    confidence_score: number;
    dominant_emotion?: string;
  };
  question_difficulty: number;
  answer_duration_seconds: number;
  feedback: string;
  attempted_at: string;
};

type SessionData = {
  _id: string;
  mode: string;
  domain: string;
  status: string;
  total_score: number;
  rating_before: number;
  rating_after: number;
  rating_delta: number;
  duration_seconds: number;
  started_at: string;
  ended_at: string;
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.4 },
  }),
};

const SCORE_COLORS = {
  excellent: '#22c55e',
  good: '#eab308',
  average: '#f97316',
  poor: '#ef4444',
};

function getScoreGrade(score: number) {
  if (score >= 80) return { label: 'Excellent', color: SCORE_COLORS.excellent, icon: '🏆' };
  if (score >= 60) return { label: 'Good', color: SCORE_COLORS.good, icon: '👍' };
  if (score >= 40) return { label: 'Average', color: SCORE_COLORS.average, icon: '📊' };
  return { label: 'Needs Work', color: SCORE_COLORS.poor, icon: '💪' };
}

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export default function AnalyticsPage() {
  const { id } = useParams();
  const { status } = useSession();
  const router = useRouter();
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [attempts, setAttempts] = useState<AttemptData[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedQ, setExpandedQ] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/sign-in');
      return;
    }
    if (status !== 'authenticated' || !id) return;

    async function load() {
      try {
        const data = await getSessionDetail(id as string);
        setSessionData(data.session);
        setAttempts(data.attempts || []);
      } catch {
        // Session not found
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [status, id, router]);

  if (loading) {
    return (
      <>
        <Header />
        <main className="bg-background flex min-h-[calc(100vh-3.5rem)] items-center justify-center">
          <div className="border-primary h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" />
        </main>
      </>
    );
  }

  if (!sessionData) {
    return (
      <>
        <Header />
        <main className="bg-background flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center gap-4">
          <BarChart3 className="h-12 w-12 text-muted-foreground/30" />
          <p className="text-muted-foreground">Session not found</p>
          <Link href="/history" className="text-primary text-sm hover:underline">
            ← Back to History
          </Link>
        </main>
      </>
    );
  }

  const grade = getScoreGrade(sessionData.total_score);
  const ratingChange = sessionData.rating_delta || 0;

  // Build chart data — map backend field names to chart-friendly names
  const scoreProgressData = attempts.map((a, i) => ({
    question: `Q${i + 1}`,
    score: Math.round((a.scores?.composite || 0) * 100),
    keyword: Math.round((a.scores?.keyword_coverage || 0) * 100),
    semantic: Math.round((a.scores?.semantic_similarity || 0) * 100),
    fluency: Math.round((a.scores?.cross_encoder_score || 0) * 100),
    face: Math.round((a.scores?.confidence_score || 0) * 100),
    difficulty: a.question_difficulty || 5,
  }));

  // Radar data for average scores
  const avgScores = attempts.reduce(
    (acc, a) => {
      acc.keyword += a.scores?.keyword_coverage || 0;
      acc.semantic += a.scores?.semantic_similarity || 0;
      acc.fluency += a.scores?.cross_encoder_score || 0;
      acc.face += a.scores?.confidence_score || 0;
      return acc;
    },
    { keyword: 0, semantic: 0, fluency: 0, face: 0 }
  );
  const n = attempts.length || 1;
  const radarData = [
    { skill: 'Keywords', value: Math.round((avgScores.keyword / n) * 100) },
    { skill: 'Semantic', value: Math.round((avgScores.semantic / n) * 100) },
    { skill: 'Fluency', value: Math.round((avgScores.fluency / n) * 100) },
    { skill: 'Confidence', value: Math.round((avgScores.face / n) * 100) },
  ];

  // Time per question
  const timeData = attempts.map((a, i) => ({
    question: `Q${i + 1}`,
    time: a.answer_duration_seconds || 0,
  }));

  return (
    <>
      <Header />
      <main className="bg-background min-h-[calc(100vh-3.5rem)]">
        <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          {/* Back + Title */}
          <motion.div
            custom={0}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="mb-6 flex items-center gap-4"
          >
            <button
              onClick={() => router.push('/history')}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/30 bg-card/60 transition hover:bg-card/80"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <h1 className="text-xl font-bold">Session Analytics</h1>
              <p className="text-muted-foreground text-xs">
                {sessionData.mode} • {sessionData.domain} •{' '}
                {new Date(sessionData.started_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </motion.div>

          {/* Score Overview Cards */}
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
            {/* Overall Score */}
            <motion.div
              custom={1}
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              className="col-span-2 flex items-center gap-4 rounded-xl border border-border/30 bg-card/60 p-5 sm:col-span-1"
            >
              <div
                className="flex h-14 w-14 items-center justify-center rounded-xl"
                style={{
                  background: `conic-gradient(${grade.color} ${sessionData.total_score}%, transparent ${sessionData.total_score}%)`,
                }}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-background text-lg font-extrabold">
                  {Math.round(sessionData.total_score)}
                </div>
              </div>
              <div>
                <p className="text-sm font-bold" style={{ color: grade.color }}>
                  {grade.icon} {grade.label}
                </p>
                <p className="text-muted-foreground text-xs">Overall Score</p>
              </div>
            </motion.div>

            {[
              {
                icon: Target,
                value: attempts.length,
                label: 'Questions',
                color: 'text-blue-400',
                bg: 'from-blue-500/20 to-cyan-500/20',
              },
              {
                icon: Clock,
                value: formatDuration(sessionData.duration_seconds || 0),
                label: 'Duration',
                color: 'text-purple-400',
                bg: 'from-purple-500/20 to-pink-500/20',
              },
              {
                icon: ratingChange >= 0 ? TrendingUp : TrendingDown,
                value: `${ratingChange >= 0 ? '+' : ''}${ratingChange}`,
                label: 'Rating',
                color: ratingChange >= 0 ? 'text-green-400' : 'text-red-400',
                bg: ratingChange >= 0 ? 'from-green-500/20 to-emerald-500/20' : 'from-red-500/20 to-rose-500/20',
              },
              {
                icon: Zap,
                value: `${sessionData.rating_after || sessionData.rating_before || 1200}`,
                label: 'New Rating',
                color: 'text-yellow-400',
                bg: 'from-yellow-500/20 to-amber-500/20',
              },
            ].map((stat, i) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  custom={i + 2}
                  initial="hidden"
                  animate="visible"
                  variants={fadeUp}
                  className="rounded-xl border border-border/30 bg-card/60 p-4"
                >
                  <div className={cn('mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br', stat.bg)}>
                    <Icon className={cn('h-4 w-4', stat.color)} />
                  </div>
                  <p className="text-lg font-bold">{stat.value}</p>
                  <p className="text-muted-foreground text-xs">{stat.label}</p>
                </motion.div>
              );
            })}
          </div>

          {/* Charts Grid */}
          <div className="grid gap-5 lg:grid-cols-2">
            {/* Score Progress Chart */}
            <motion.div
              custom={6}
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              className="rounded-xl border border-border/30 bg-card/60 p-5"
            >
              <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
                <TrendingUp className="h-4 w-4 text-blue-400" />
                Score Progression
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={scoreProgressData}>
                  <defs>
                    <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="question" stroke="#888" fontSize={12} />
                  <YAxis domain={[0, 100]} stroke="#888" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      background: '#1a1a2e',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke="#3b82f6"
                    fill="url(#scoreGrad)"
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6', r: 4 }}
                    activeDot={{ r: 6, fill: '#60a5fa' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Skill Radar */}
            <motion.div
              custom={7}
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              className="rounded-xl border border-border/30 bg-card/60 p-5"
            >
              <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
                <Brain className="h-4 w-4 text-purple-400" />
                Skill Breakdown
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <RadarChart data={radarData} outerRadius={80}>
                  <PolarGrid stroke="rgba(255,255,255,0.1)" />
                  <PolarAngleAxis dataKey="skill" tick={{ fill: '#aaa', fontSize: 11 }} />
                  <Radar
                    name="Score"
                    dataKey="value"
                    stroke="#a855f7"
                    fill="#a855f7"
                    fillOpacity={0.25}
                    strokeWidth={2}
                  />
                  <Tooltip
                    contentStyle={{
                      background: '#1a1a2e',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Score Breakdown Bar Chart */}
            <motion.div
              custom={8}
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              className="rounded-xl border border-border/30 bg-card/60 p-5"
            >
              <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
                <BarChart3 className="h-4 w-4 text-green-400" />
                Per-Question Scores
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={scoreProgressData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="question" stroke="#888" fontSize={12} />
                  <YAxis domain={[0, 100]} stroke="#888" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      background: '#1a1a2e',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="keyword" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} name="Keyword" />
                  <Bar dataKey="semantic" stackId="b" fill="#22c55e" radius={[0, 0, 0, 0]} name="Semantic" />
                  <Bar dataKey="fluency" stackId="c" fill="#eab308" radius={[0, 0, 0, 0]} name="Fluency" />
                  <Bar dataKey="face" stackId="d" fill="#a855f7" radius={[4, 4, 0, 0]} name="Confidence" />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Time per Question */}
            <motion.div
              custom={9}
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              className="rounded-xl border border-border/30 bg-card/60 p-5"
            >
              <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
                <Clock className="h-4 w-4 text-orange-400" />
                Time per Question
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={timeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="question" stroke="#888" fontSize={12} />
                  <YAxis stroke="#888" fontSize={12} unit="s" />
                  <Tooltip
                    contentStyle={{
                      background: '#1a1a2e',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                    formatter={(value: any) => [`${value}s`, 'Time']}
                  />
                  <Bar dataKey="time" radius={[4, 4, 0, 0]}>
                    {timeData.map((entry, i) => (
                      <Cell
                        key={i}
                        fill={entry.time > 120 ? '#ef4444' : entry.time > 60 ? '#f97316' : '#22c55e'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          </div>

          {/* Question Details */}
          <motion.div
            custom={10}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="mt-6 rounded-xl border border-border/30 bg-card/60 p-5"
          >
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
              <Mic className="h-4 w-4 text-cyan-400" />
              Question Details
            </h3>
            <div className="space-y-3">
              {attempts.map((a, i) => {
                const composite = Math.round((a.scores?.composite || 0) * 100);
                const qGrade = getScoreGrade(composite);
                const isExpanded = expandedQ === a._id;
                const hasFeedback = a.feedback && a.feedback !== 'Generating AI feedback...' && a.feedback !== 'Feedback generation unavailable.';
                return (
                  <div
                    key={a._id}
                    className={cn(
                      'rounded-lg border bg-background/40 p-4 transition-all duration-200 cursor-pointer',
                      isExpanded
                        ? 'border-primary/30 bg-primary/[0.03]'
                        : 'border-border/20 hover:border-border/40 hover:bg-background/60'
                    )}
                    onClick={() => setExpandedQ(isExpanded ? null : a._id)}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold"
                        style={{ background: `${qGrade.color}20`, color: qGrade.color }}
                      >
                        Q{i + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium leading-snug">
                            {a.question_text || 'Question text unavailable'}
                          </p>
                          <ChevronDown
                            className={cn(
                              'h-4 w-4 shrink-0 text-muted-foreground/50 transition-transform duration-200',
                              isExpanded && 'rotate-180'
                            )}
                          />
                        </div>
                        {!isExpanded && a.user_answer_transcript && (
                          <p className="text-muted-foreground mt-2 text-xs italic leading-relaxed">
                            "{a.user_answer_transcript.slice(0, 200)}{a.user_answer_transcript.length > 200 ? '…' : ''}"
                          </p>
                        )}
                        <div className="mt-3 flex flex-wrap gap-2">
                          {[
                            { label: 'Composite', val: composite, color: qGrade.color },
                            { label: 'Keyword', val: Math.round((a.scores?.keyword_coverage || 0) * 100), color: '#3b82f6' },
                            { label: 'Semantic', val: Math.round((a.scores?.semantic_similarity || 0) * 100), color: '#22c55e' },
                            { label: 'Fluency', val: Math.round((a.scores?.cross_encoder_score || 0) * 100), color: '#eab308' },
                            { label: 'Confidence', val: Math.round((a.scores?.confidence_score || 0) * 100), color: '#a855f7' },
                          ].map((s) => (
                            <span
                              key={s.label}
                              className="flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
                              style={{ background: `${s.color}15`, color: s.color }}
                            >
                              {s.label}: {s.val}%
                            </span>
                          ))}
                          <span className="flex items-center gap-1 rounded-full bg-white/5 px-2 py-0.5 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" /> {a.answer_duration_seconds}s
                          </span>
                          <span className="flex items-center gap-1 rounded-full bg-white/5 px-2 py-0.5 text-xs text-muted-foreground">
                            Diff: {a.question_difficulty}
                          </span>
                        </div>

                        {/* Expanded: AI Feedback + Full Transcript */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.25 }}
                              className="overflow-hidden"
                            >
                              <div className="mt-4 space-y-3 border-t border-border/20 pt-4">
                                {/* AI Feedback */}
                                <div className="rounded-lg bg-primary/5 border border-primary/20 p-3">
                                  <p className="text-primary mb-1.5 text-xs font-semibold flex items-center gap-1.5">
                                    <Sparkles className="h-3.5 w-3.5" />
                                    AI Feedback
                                  </p>
                                  <p className="text-sm leading-relaxed">
                                    {hasFeedback
                                      ? a.feedback
                                      : (
                                        <span className="text-muted-foreground italic">
                                          Feedback not yet generated for this question.
                                        </span>
                                      )}
                                  </p>
                                </div>

                                {/* Full Transcript */}
                                {a.user_answer_transcript && (
                                  <div className="rounded-lg bg-card/60 border border-border/20 p-3">
                                    <p className="text-muted-foreground mb-1.5 text-xs font-semibold flex items-center gap-1.5">
                                      <Mic className="h-3.5 w-3.5" />
                                      Your Answer
                                    </p>
                                    <p className="text-sm leading-relaxed">
                                      {a.user_answer_transcript}
                                    </p>
                                  </div>
                                )}

                                {/* Emotion */}
                                {a.scores?.dominant_emotion && (
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <span className="rounded-full bg-white/5 px-2 py-0.5">
                                      Dominant Emotion: <span className="font-medium text-foreground">{a.scores.dominant_emotion}</span>
                                    </span>
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </div>
                );
              })}
              {attempts.length === 0 && (
                <div className="py-8 text-center">
                  <p className="text-muted-foreground text-sm">No question attempts recorded for this session.</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </main>
    </>
  );
}
