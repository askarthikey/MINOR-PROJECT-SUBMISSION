'use client';

import { motion } from 'framer-motion';
import {
  Brain,
  Camera,
  ChevronRight,
  Clock,
  Cpu,
  Database,
  Globe,
  Layers,
  Loader2,
  Mic,
  Settings2,
  Shield,
  Volume2,
  Zap,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { startSession } from '@/lib/api-client';
import { Routes } from '@/lib/routes';

const DOMAINS = [
  { id: 'javascript', label: 'JavaScript', icon: '🟨', color: 'from-yellow-500/20 to-amber-500/20', borderColor: 'border-yellow-500/40' },
  { id: 'Machine Learning', label: 'Machine Learning', icon: '🤖', color: 'from-purple-500/20 to-pink-500/20', borderColor: 'border-purple-500/40' },
  { id: 'Operating Systems', label: 'Operating Systems', icon: '🖥️', color: 'from-blue-500/20 to-cyan-500/20', borderColor: 'border-blue-500/40' },
  { id: 'Computer Networks', label: 'Computer Networks', icon: '🌐', color: 'from-green-500/20 to-emerald-500/20', borderColor: 'border-green-500/40' },
  { id: 'OOPs', label: 'OOPs', icon: '🧱', color: 'from-red-500/20 to-orange-500/20', borderColor: 'border-red-500/40' },
  { id: 'DBMS', label: 'DBMS', icon: '🗄️', color: 'from-indigo-500/20 to-violet-500/20', borderColor: 'border-indigo-500/40' },
];

const MODES = [
  {
    value: 'practice',
    label: 'Practice',
    desc: '5 questions • No rating impact • Hints enabled',
    details: 'Perfect for warming up or learning new topics. Your rating won\'t change.',
    icon: Settings2,
    gradient: 'from-emerald-500/20 to-green-500/20',
    badge: 'FREE',
    badgeColor: 'bg-green-500/20 text-green-400',
  },
  {
    value: 'interview',
    label: 'Mock Interview',
    desc: '10 questions • Full rating impact • Camera enabled',
    details: 'Full interview simulation with adaptive difficulty. Rating changes apply.',
    icon: Mic,
    gradient: 'from-blue-500/20 to-cyan-500/20',
    badge: 'RANKED',
    badgeColor: 'bg-blue-500/20 text-blue-400',
  },
  {
    value: 'speed',
    label: 'Speed Round',
    desc: '15 questions • 60s each • 50% rating impact',
    details: 'Quick-fire questions under time pressure. Half rating impact.',
    icon: Zap,
    gradient: 'from-orange-500/20 to-amber-500/20',
    badge: 'TIMED',
    badgeColor: 'bg-orange-500/20 text-orange-400',
  },
];

export default function InterviewPage() {
  const router = useRouter();
  const { status } = useSession();
  const [selectedMode, setSelectedMode] = useState('interview');
  const [selectedDomain, setSelectedDomain] = useState('javascript');
  const [loading, setLoading] = useState(false);

  if (status === 'unauthenticated') {
    router.push(Routes.SignIn);
    return null;
  }

  const currentMode = MODES.find((m) => m.value === selectedMode);

  const handleStart = async () => {
    setLoading(true);
    try {
      const session = await startSession(selectedMode, selectedDomain);
      router.push(`/session/${session.session_id}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to start session');
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <main className="bg-background min-h-[calc(100vh-3.5rem)]">
        <div className="w-full px-6 py-8 lg:px-10">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight">Start Interview</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Choose your domain, mode, and begin when ready.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            {/* Left column — Domain + Mode */}
            <div className="lg:col-span-2 space-y-8">
              {/* Domain Selection */}
              <section>
                <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold">
                  <Layers className="h-4 w-4 text-primary" />
                  Select Domain
                </h2>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
                  {DOMAINS.map((domain) => {
                    const isSelected = selectedDomain === domain.id;
                    return (
                      <motion.button
                        key={domain.id}
                        whileTap={{ scale: 0.97 }}
                        whileHover={{ scale: 1.02 }}
                        onClick={() => setSelectedDomain(domain.id)}
                        className={`relative rounded-xl border p-4 text-center transition-all ${
                          isSelected
                            ? `${domain.borderColor} bg-gradient-to-br ${domain.color} ring-2 ring-primary/30`
                            : 'border-border/30 bg-card/40 hover:border-border/60 hover:bg-card/60'
                        }`}
                      >
                        <span className="text-3xl">{domain.icon}</span>
                        <p className="mt-2 text-xs font-semibold leading-tight">{domain.label}</p>
                        {isSelected && (
                          <motion.div
                            layoutId="domain-check"
                            className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-black font-bold"
                          >
                            ✓
                          </motion.div>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </section>

              {/* Mode Selection */}
              <section>
                <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold">
                  <Shield className="h-4 w-4 text-primary" />
                  Session Mode
                </h2>
                <div className="grid gap-3 sm:grid-cols-3">
                  {MODES.map((mode) => {
                    const Icon = mode.icon;
                    const isSelected = selectedMode === mode.value;
                    return (
                      <motion.button
                        key={mode.value}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSelectedMode(mode.value)}
                        className={`rounded-xl border p-5 text-left transition-all ${
                          isSelected
                            ? 'border-primary bg-primary/8 ring-primary/30 ring-2'
                            : 'border-border/30 bg-card/40 hover:border-border/60'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div
                            className={`bg-gradient-to-br ${mode.gradient} inline-flex h-10 w-10 items-center justify-center rounded-lg`}
                          >
                            <Icon className="h-5 w-5" />
                          </div>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${mode.badgeColor}`}>
                            {mode.badge}
                          </span>
                        </div>
                        <p className="text-sm font-bold">{mode.label}</p>
                        <p className="text-muted-foreground mt-1 text-xs leading-relaxed">{mode.desc}</p>
                      </motion.button>
                    );
                  })}
                </div>
              </section>
            </div>

            {/* Right column — Summary + Start */}
            <div className="space-y-4">
              {/* Session Summary Card */}
              <div className="rounded-xl border border-border/30 bg-card/60 p-5 backdrop-blur-sm">
                <h3 className="text-sm font-bold mb-4">Session Summary</h3>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Domain</span>
                    <span className="font-medium">
                      {DOMAINS.find((d) => d.id === selectedDomain)?.icon}{' '}
                      {DOMAINS.find((d) => d.id === selectedDomain)?.label}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Mode</span>
                    <span className="font-medium">{currentMode?.label}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Questions</span>
                    <span className="font-medium">
                      {selectedMode === 'practice' ? '5' : selectedMode === 'speed' ? '15' : '10'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Rating Impact</span>
                    <span className={`font-medium ${
                      selectedMode === 'practice' ? 'text-green-400' :
                      selectedMode === 'speed' ? 'text-orange-400' : 'text-blue-400'
                    }`}>
                      {selectedMode === 'practice' ? 'None' :
                       selectedMode === 'speed' ? '50%' : '100%'}
                    </span>
                  </div>
                  {selectedMode === 'speed' && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Time per Q</span>
                      <span className="font-medium text-orange-400">60s</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 h-px bg-border/30" />

                <p className="text-muted-foreground mt-3 text-xs leading-relaxed">
                  {currentMode?.details}
                </p>
              </div>

              {/* Requirements */}
              <div className="rounded-xl border border-border/30 bg-card/60 p-5 backdrop-blur-sm">
                <h3 className="mb-3 text-sm font-bold">Requirements</h3>
                <div className="space-y-2.5">
                  {[
                    { icon: Mic, label: 'Microphone', required: true },
                    { icon: Camera, label: 'Camera', required: selectedMode === 'interview' },
                    { icon: Volume2, label: 'Quiet space', required: false },
                  ].map((req) => {
                    const ReqIcon = req.icon;
                    return (
                      <div key={req.label} className="flex items-center gap-2.5">
                        <div className="bg-primary/10 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg">
                          <ReqIcon className="text-primary h-3.5 w-3.5" />
                        </div>
                        <span className="text-xs">{req.label}</span>
                        <span className={`ml-auto text-[10px] font-medium ${
                          req.required ? 'text-amber-400' : 'text-muted-foreground'
                        }`}>
                          {req.required ? 'Required' : 'Optional'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Start Button */}
              <motion.div whileHover={{ scale: 1.02 }}>
                <Button
                  onClick={handleStart}
                  disabled={loading}
                  size="lg"
                  className="from-primary to-accent w-full gap-2 bg-gradient-to-r font-bold text-black"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Starting session…
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4" />
                      Start {currentMode?.label}
                      <ChevronRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </motion.div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
