'use client';

import { motion } from 'framer-motion';
import {
  BarChart3,
  Brain,
  ChevronRight,
  Mic,
  Shield,
  Sparkles,
  Target,
  Trophy,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Routes } from '@/lib/routes';

const FEATURES = [
  {
    icon: Mic,
    title: 'Voice-Powered Answers',
    description: 'Speak your answers naturally with real-time speech-to-text transcription.',
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    icon: Brain,
    title: 'AI Scoring Engine',
    description: 'Multi-model scoring: semantic similarity, keyword coverage, and cross-encoder re-ranking.',
    gradient: 'from-purple-500 to-pink-500',
  },
  {
    icon: Target,
    title: 'Adaptive Difficulty',
    description: 'N+2 strategy adjusts question difficulty based on your real-time performance.',
    gradient: 'from-orange-500 to-red-500',
  },
  {
    icon: Trophy,
    title: 'ELO Rating & Badges',
    description: 'Climb tiers from Bronze to Legend. Earn badges for milestones and streaks.',
    gradient: 'from-yellow-500 to-amber-500',
  },
  {
    icon: Shield,
    title: 'Emotion Confidence',
    description: 'Camera-based facial emotion analysis adds a confidence dimension to your score.',
    gradient: 'from-green-500 to-emerald-500',
  },
  {
    icon: BarChart3,
    title: 'Deep Analytics',
    description: 'Track topic mastery, session history, and performance trends over time.',
    gradient: 'from-indigo-500 to-violet-500',
  },
];

const STATS = [
  { value: '35+', label: 'Interview Questions' },
  { value: '18', label: 'Difficulty Levels' },
  { value: '3', label: 'AI Models' },
  { value: '8', label: 'Rating Tiers' },
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: 'easeOut' as const },
  }),
};

export default function Page() {
  const { status } = useSession();
  const isAuthorized = status === 'authenticated';

  return (
    <>
      <Header />
      <main className="bg-background text-foreground min-h-screen">
        {/* Hero */}
        <section className="relative overflow-hidden">
          {/* Background glow */}
          <div className="absolute inset-0 -z-10">
            <div className="from-primary/8 via-accent/5 absolute inset-0 bg-gradient-to-br to-transparent" />
            <div className="bg-primary/5 absolute left-1/2 top-1/4 h-[500px] w-[500px] -translate-x-1/2 rounded-full blur-[120px]" />
          </div>

          <div className="mx-auto flex max-w-5xl flex-col items-center px-6 pb-16 pt-20 text-center sm:pt-28">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              className="bg-primary/10 text-primary mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold"
            >
              <Sparkles className="h-3.5 w-3.5" />
              AI-Powered Interview Training
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.6 }}
              className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl"
            >
              Ace Your Next{' '}
              <span className="from-primary to-accent bg-gradient-to-r bg-clip-text text-transparent">
                Technical
              </span>{' '}
              Interview
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="text-muted-foreground mt-5 max-w-2xl text-base sm:text-lg"
            >
              Practice with AI that listens, scores, and adapts. Voice-powered answers, real-time
              emotion analysis, and adaptive difficulty — like having a senior interviewer on demand.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="mt-8 flex gap-3"
            >
              <Button asChild size="lg" className="from-primary to-accent gap-2 bg-gradient-to-r font-semibold text-black">
                <Link href={isAuthorized ? Routes.Interview : Routes.SignIn}>
                  {isAuthorized ? 'Start Interview' : 'Get Started'}
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
              {isAuthorized && (
                <Button asChild variant="outline" size="lg">
                  <Link href={Routes.Dashboard}>Dashboard</Link>
                </Button>
              )}
            </motion.div>
          </div>
        </section>

        {/* Stats bar */}
        <section className="border-border/30 border-y">
          <div className="mx-auto grid max-w-4xl grid-cols-2 gap-4 px-6 py-8 sm:grid-cols-4">
            {STATS.map((stat, i) => (
              <motion.div
                key={stat.label}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                className="text-center"
              >
                <p className="from-primary to-accent bg-gradient-to-r bg-clip-text text-3xl font-extrabold text-transparent">
                  {stat.value}
                </p>
                <p className="text-muted-foreground mt-1 text-xs">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Features Grid */}
        <section className="mx-auto max-w-6xl px-6 py-20">
          <div className="mb-12 text-center">
            <h2 className="text-2xl font-bold sm:text-3xl">Everything You Need to Prepare</h2>
            <p className="text-muted-foreground mt-3 text-sm sm:text-base">
              A complete interview simulation platform powered by cutting-edge AI models.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  custom={i}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeUp}
                  className="bg-card/60 border-border/30 group rounded-xl border p-5 backdrop-blur-sm transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
                >
                  <div
                    className={`bg-gradient-to-br ${feature.gradient} mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg opacity-80`}
                  >
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-sm font-semibold">{feature.title}</h3>
                  <p className="text-muted-foreground mt-1.5 text-xs leading-relaxed">
                    {feature.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* CTA */}
        <section className="border-border/20 border-t">
          <div className="mx-auto max-w-3xl px-6 py-16 text-center">
            <h2 className="text-2xl font-bold sm:text-3xl">Ready to Train?</h2>
            <p className="text-muted-foreground mt-3 text-sm">
              Start a mock interview in under 30 seconds. No setup required.
            </p>
            <Button
              asChild
              size="lg"
              className="from-primary to-accent mt-6 gap-2 bg-gradient-to-r font-semibold text-black"
            >
              <Link href={isAuthorized ? Routes.Interview : Routes.SignIn}>
                <Zap className="h-4 w-4" />
                {isAuthorized ? 'Launch Interview' : 'Create Free Account'}
              </Link>
            </Button>
          </div>
        </section>
      </main>
    </>
  );
}
