'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  Camera,
  CameraOff,
  CheckCircle2,
  ChevronRight,
  Clock,
  Eye,
  Lightbulb,
  Loader2,
  Mic,
  MicOff,
  Send,
  Shield,
  Sparkles,
  Square,
  Timer,
  XCircle,
  Zap,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { useCamera, type EmotionFrame } from '@/hooks/useCamera';
import { useSTT } from '@/hooks/useSTT';
import { endSession, submitAttempt, ML_URL } from '@/lib/api-client';
import { Routes } from '@/lib/routes';
import { cn } from '@/lib/utils';

type Question = {
  id: string;
  question_text: string;
  topic: string;
  domain: string;
  subtopic: string;
  difficulty_rating: number;
  bloom_level: string;
  question_type: string;
};

type ModeConfig = {
  label: string;
  session_timer: number | null;
  per_question_timer: number | null;
  hints_enabled: boolean;
  camera_required: boolean;
  rating_impact: number;
};

type SessionInitData = {
  session_id: string;
  question: Question;
  mode: string;
  mode_config: ModeConfig;
  question_number: number;
  max_questions: number;
  domain: string;
};

type AttemptResult = {
  scores: {
    composite: number;
    semantic_similarity: number;
    keyword_coverage: number;
    cross_encoder_score: number;
    confidence_score: number;
    dominant_emotion: string;
  };
  feedback: string;
  next_question: Question | null;
  session_complete: boolean;
  question_number: number;
  max_questions: number;
};

type SystemCheckState = 'checking' | 'ready' | 'failed';

// Phase within active answering
type AnswerPhase = 'reading' | 'answering' | 'idle';

export default function SessionPage() {
  const params = useParams();
  const router = useRouter();
  const { data: authSession } = useSession();
  const sessionId = params.id as string;

  // Phase: 'setup' | 'active' | 'ended'
  const [phase, setPhase] = useState<'setup' | 'active' | 'ended'>('setup');

  // Setup/System check state
  const [initData, setInitData] = useState<SessionInitData | null>(null);
  const [micPermission, setMicPermission] = useState<SystemCheckState>('checking');
  const [camPermission, setCamPermission] = useState<SystemCheckState>('checking');
  const [sttCheck, setSttCheck] = useState<SystemCheckState>('checking');

  // Session state
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [questionNumber, setQuestionNumber] = useState(1);
  const [maxQuestions, setMaxQuestions] = useState(10);
  const [results, setResults] = useState<AttemptResult[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [answerStartTime, setAnswerStartTime] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [questionTimer, setQuestionTimer] = useState<number | null>(null);
  const [endSessionData, setEndSessionData] = useState<any>(null);

  // Reading countdown state
  const [answerPhase, setAnswerPhase] = useState<AnswerPhase>('idle');
  const [readingCountdown, setReadingCountdown] = useState(5);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Hooks
  const {
    transcript,
    interimTranscript,
    isListening,
    isSupported: sttSupported,
    start: startSTT,
    stop: stopSTT,
    reset: resetSTT,
  } = useSTT();

  const {
    videoRef,
    start: startCamera,
    stop: stopCamera,
    emotionFrames,
    currentEmotion,
    isActive: cameraActive,
    resetFrames,
  } = useCamera(ML_URL);

  // Load session data
  useEffect(() => {
    const stored = sessionStorage.getItem(`session_${sessionId}`);
    if (stored) {
      try {
        const data = JSON.parse(stored) as SessionInitData;
        setInitData(data);
        setCurrentQuestion(data.question);
        setQuestionNumber(data.question_number);
        setMaxQuestions(data.max_questions);
      } catch {
        toast.error('Failed to load session data');
        router.push(Routes.Interview);
      }
    } else {
      toast.error('No session data found');
      router.push(Routes.Interview);
    }
  }, [sessionId, router]);

  // System check: permissions
  useEffect(() => {
    if (phase !== 'setup') return;

    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        stream.getTracks().forEach((t) => t.stop());
        setMicPermission('ready');
      })
      .catch(() => setMicPermission('failed'));

    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        stream.getTracks().forEach((t) => t.stop());
        setCamPermission('ready');
      })
      .catch(() => setCamPermission('failed'));

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setSttCheck(SpeechRecognition ? 'ready' : 'failed');
  }, [phase]);

  // Question timer for speed rounds
  useEffect(() => {
    if (
      phase !== 'active' ||
      !isListening ||
      !initData?.mode_config.per_question_timer
    )
      return;

    const timer = initData.mode_config.per_question_timer;
    const remaining = timer - elapsed;
    setQuestionTimer(remaining);

    if (remaining <= 0) {
      handleSubmitAnswer();
    }
  }, [elapsed, phase, isListening, initData]);

  // Elapsed timer
  useEffect(() => {
    if (!isListening) return;
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - answerStartTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [isListening, answerStartTime]);

  const startReadingCountdown = useCallback(() => {
    setAnswerPhase('reading');
    setReadingCountdown(5);

    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

    let count = 5;
    countdownIntervalRef.current = setInterval(() => {
      count -= 1;
      setReadingCountdown(count);
      if (count <= 0) {
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
        // Auto-start answering
        setAnswerPhase('answering');
      }
    }, 1000);
  }, []);

  // Auto-start reading countdown when entering active phase or moving to next question
  useEffect(() => {
    if (phase === 'active' && currentQuestion && answerPhase === 'idle') {
      startReadingCountdown();
    }
  }, [phase, currentQuestion, answerPhase, startReadingCountdown]);

  // When answerPhase transitions to 'answering', start mic + cam
  useEffect(() => {
    if (answerPhase === 'answering' && !isListening) {
      resetSTT();
      resetFrames();
      setAnswerStartTime(Date.now());
      setElapsed(0);
      startSTT();
      if (initData?.mode_config.camera_required || camPermission === 'ready') {
        startCamera();
      }
    }
  }, [answerPhase]);

  // Cleanup countdown on unmount
  useEffect(() => {
    return () => {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, []);

  const canStartInterview =
    micPermission === 'ready' &&
    sttCheck === 'ready' &&
    (initData?.mode_config.camera_required ? camPermission === 'ready' : true);

  const handleBeginInterview = () => {
    setPhase('active');
  };

  const handleStartAnswer = useCallback(() => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    setAnswerPhase('answering');
  }, []);

  const handleSubmitAnswer = useCallback(async () => {
    const finalTranscript = stopSTT();
    stopCamera();
    setIsSubmitting(true);
    setAnswerPhase('idle');

    const duration = Math.floor((Date.now() - answerStartTime) / 1000);

    try {
      const result = await submitAttempt({
        session_id: sessionId,
        question_id: currentQuestion?.id || '',
        transcript: finalTranscript || transcript,
        answer_duration: duration,
        emotion_frames: emotionFrames,
      });

      setResults((prev) => [...prev, result]);
      setQuestionNumber(result.question_number);
      setMaxQuestions(result.max_questions);

      if (result.session_complete) {
        try {
          const data = await endSession(sessionId);
          setEndSessionData(data);
          setPhase('ended');
        } catch {
          toast.error('Failed to end session');
        }
      } else if (result.next_question) {
        setCurrentQuestion(result.next_question);
        resetSTT();
        resetFrames();
        setElapsed(0);
        setQuestionTimer(null);
        setAnswerPhase('idle');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit answer');
    } finally {
      setIsSubmitting(false);
    }
  }, [
    stopSTT,
    stopCamera,
    answerStartTime,
    sessionId,
    currentQuestion,
    transcript,
    emotionFrames,
    resetSTT,
    resetFrames,
  ]);

  const handleEndSession = useCallback(async () => {
    try {
      stopSTT();
      stopCamera();
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      const data = await endSession(sessionId);
      setEndSessionData(data);
      setPhase('ended');
    } catch {
      toast.error('Failed to end session');
    }
  }, [sessionId, stopSTT, stopCamera]);

  // Utility functions
  function formatTime(s: number) {
    const min = Math.floor(s / 60);
    const sec = s % 60;
    return `${min}:${sec.toString().padStart(2, '0')}`;
  }

  function getScoreColor(score: number) {
    if (score >= 0.8) return 'text-emerald-400';
    if (score >= 0.6) return 'text-yellow-400';
    if (score >= 0.4) return 'text-orange-400';
    return 'text-red-400';
  }

  function getScoreBarColor(score: number) {
    if (score >= 0.8) return 'bg-emerald-500';
    if (score >= 0.6) return 'bg-yellow-500';
    if (score >= 0.4) return 'bg-orange-500';
    return 'bg-red-500';
  }

  function getDifficultyColor(d: number) {
    if (d <= 5) return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    if (d <= 10) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    if (d <= 15) return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    return 'bg-red-500/20 text-red-400 border-red-500/30';
  }

  function getCheckIcon(state: SystemCheckState) {
    if (state === 'ready') return <CheckCircle2 className="h-5 w-5 text-emerald-400" />;
    if (state === 'failed') return <XCircle className="h-5 w-5 text-red-400" />;
    return <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />;
  }

  // ──────────────────────────────────────────────────
  // PHASE: SETUP — System check + Instructions
  // ──────────────────────────────────────────────────
  if (phase === 'setup') {
    return (
      <main className="bg-background fixed inset-0 flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-lg"
        >
          <div className="text-center mb-8">
            <div className="from-primary to-accent mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br">
              <Shield className="h-7 w-7 text-black" />
            </div>
            <h1 className="text-2xl font-bold">Pre-Interview Setup</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Let&apos;s make sure everything is ready before we begin.
            </p>
          </div>

          {/* Session Info */}
          {initData && (
            <div className="bg-card/60 border-border/30 rounded-xl border p-4 mb-6">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-muted-foreground text-[10px] uppercase tracking-wider">Mode</p>
                  <p className="text-sm font-bold">{initData.mode_config?.label || initData.mode || 'Interview'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-[10px] uppercase tracking-wider">Domain</p>
                  <p className="text-sm font-bold">{initData.domain}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-[10px] uppercase tracking-wider">Questions</p>
                  <p className="text-sm font-bold">{initData.max_questions}</p>
                </div>
              </div>
            </div>
          )}

          {/* System Checks */}
          <div className="bg-card/60 border-border/30 rounded-xl border divide-y divide-border/20">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <Mic className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-sm font-medium">Microphone</p>
                  <p className="text-muted-foreground text-[10px]">Required for voice answers</p>
                </div>
              </div>
              {getCheckIcon(micPermission)}
            </div>
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <Camera className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-sm font-medium">Camera</p>
                  <p className="text-muted-foreground text-[10px]">
                    {initData?.mode_config.camera_required ? 'Required for emotion analysis' : 'Optional — for emotion analysis'}
                  </p>
                </div>
              </div>
              {getCheckIcon(camPermission)}
            </div>
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <Zap className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-sm font-medium">Speech-to-Text</p>
                  <p className="text-muted-foreground text-[10px]">Browser speech recognition</p>
                </div>
              </div>
              {getCheckIcon(sttCheck)}
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-card/40 border-border/20 rounded-xl border p-4 mt-4">
            <h3 className="text-xs font-bold mb-2 flex items-center gap-1.5">
              <Lightbulb className="h-3.5 w-3.5 text-primary" />
              Instructions
            </h3>
            <ul className="text-muted-foreground text-xs space-y-1.5">
              <li>• You&apos;ll get 5 seconds to read each question</li>
              <li>• Recording starts automatically after the countdown</li>
              <li>• Speak clearly and at a natural pace</li>
              <li>• Click &quot;Submit&quot; when done, or skip the countdown to start early</li>
              {initData?.mode_config.per_question_timer && (
                <li className="text-orange-400">
                  • ⏱ You have {initData.mode_config.per_question_timer}s per question
                </li>
              )}
              {initData?.mode_config.rating_impact === 0 && (
                <li className="text-emerald-400">• ✨ Practice mode — your rating won&apos;t change</li>
              )}
            </ul>
          </div>

          {/* Start Button */}
          <div className="mt-6 flex flex-col gap-3">
            <Button
              onClick={handleBeginInterview}
              disabled={!canStartInterview}
              size="lg"
              className="from-primary to-accent w-full gap-2 bg-gradient-to-r font-bold text-black"
            >
              <Zap className="h-4 w-4" />
              Begin {initData?.mode_config.label || 'Interview'}
              <ChevronRight className="h-4 w-4" />
            </Button>
            {!canStartInterview && (
              <p className="text-center text-xs text-red-400">
                Please grant microphone{initData?.mode_config.camera_required ? ' and camera' : ''} access to continue
              </p>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(Routes.Interview)}
              className="text-muted-foreground text-xs"
            >
              Go back to configuration
            </Button>
          </div>
        </motion.div>
      </main>
    );
  }

  // ──────────────────────────────────────────────────
  // PHASE: ENDED — Summary
  // ──────────────────────────────────────────────────
  if (phase === 'ended') {
    const avgScore =
      results.length > 0
        ? results.reduce((sum, r) => sum + (r.scores?.composite || 0), 0) / results.length
        : 0;

    return (
      <main className="bg-background fixed inset-0 flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-lg text-center"
        >
          <div className="from-primary to-accent mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br">
            <Sparkles className="h-8 w-8 text-black" />
          </div>
          <h1 className="text-2xl font-bold">
            {initData?.mode_config.label || 'Interview'} Complete!
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            You answered {endSessionData?.questions_answered || results.length} questions
          </p>

          <div className="bg-card/60 border-border/30 mt-6 rounded-xl border p-5">
            <p className="text-muted-foreground text-xs">Average Score</p>
            <p className={cn('text-4xl font-extrabold', getScoreColor(avgScore))}>
              {Math.round(avgScore * 100)}%
            </p>

            {endSessionData && (
              <div className="mt-4 grid grid-cols-2 gap-3 text-center">
                <div className="bg-background/40 rounded-lg p-2">
                  <p className={cn('text-xl font-bold', endSessionData.rating_delta > 0 ? 'text-emerald-400' : endSessionData.rating_delta < 0 ? 'text-red-400' : 'text-muted-foreground')}>
                    {endSessionData.rating_delta > 0 ? '+' : ''}{endSessionData.rating_delta}
                  </p>
                  <p className="text-muted-foreground text-xs">Rating Δ</p>
                </div>
                <div className="bg-background/40 rounded-lg p-2">
                  <p className="text-xl font-bold">{endSessionData.new_rating}</p>
                  <p className="text-muted-foreground text-xs">New Rating</p>
                </div>
              </div>
            )}

            {endSessionData?.new_badges?.length > 0 && (
              <div className="mt-4 rounded-lg bg-primary/10 p-3">
                <p className="text-primary text-xs font-bold mb-1">🏆 New Badges!</p>
                <div className="flex flex-wrap gap-1.5 justify-center">
                  {endSessionData.new_badges.map((badge: string) => (
                    <span key={badge} className="bg-primary/20 text-primary rounded-full px-2 py-0.5 text-[10px] font-medium">
                      {badge}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Per-question summary */}
          {results.length > 0 && (
            <div className="bg-card/40 border-border/20 mt-4 rounded-xl border p-4">
              <p className="text-xs font-bold mb-3">Question Breakdown</p>
              <div className="space-y-2">
                {results.map((r, i) => (
                  <div key={i} className="flex items-center gap-3 text-xs">
                    <span className="text-muted-foreground w-8">Q{i + 1}</span>
                    <div className="flex-1 h-2 rounded-full bg-border/30 overflow-hidden">
                      <div
                        className={cn('h-full rounded-full transition-all', getScoreBarColor(r.scores.composite))}
                        style={{ width: `${r.scores.composite * 100}%` }}
                      />
                    </div>
                    <span className={cn('font-mono font-bold w-10 text-right', getScoreColor(r.scores.composite))}>
                      {Math.round(r.scores.composite * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 flex justify-center gap-3">
            <Button variant="outline" onClick={() => router.push(Routes.Dashboard)}>
              Dashboard
            </Button>
            <Button
              className="from-primary to-accent bg-gradient-to-r text-black"
              onClick={() => router.push(Routes.Interview)}
            >
              <Zap className="mr-1 h-3.5 w-3.5" />
              New Interview
            </Button>
          </div>
        </motion.div>
      </main>
    );
  }

  // ──────────────────────────────────────────────────
  // PHASE: ACTIVE — Interview in progress (FULLSCREEN)
  // ──────────────────────────────────────────────────
  return (
    <main className="bg-background text-foreground fixed inset-0 flex flex-col overflow-hidden">
      {/* Minimal top bar */}
      <div className="border-border/20 bg-card/60 flex-shrink-0 border-b px-4 py-2 backdrop-blur-xl z-40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Progress */}
            <div className="flex items-center gap-2">
              <span className="text-primary text-sm font-extrabold">
                Q{questionNumber}
              </span>
              <span className="text-muted-foreground/40 text-xs">/</span>
              <span className="text-muted-foreground text-xs">{maxQuestions}</span>
            </div>
            <div className="bg-border/20 h-1.5 w-28 rounded-full overflow-hidden">
              <motion.div
                className="bg-gradient-to-r from-primary to-accent h-full rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${(questionNumber / maxQuestions) * 100}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <span className="bg-primary/10 text-primary rounded-md px-2 py-0.5 text-[10px] font-medium hidden sm:inline">
              {initData?.domain}
            </span>
            <span className="bg-card/80 border-border/20 rounded-md border px-2 py-0.5 text-[10px] font-medium hidden sm:inline">
              {initData?.mode_config?.label}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Live indicators */}
            {answerPhase === 'answering' && isListening && (
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                </span>
                <span className="text-red-400 text-[10px] font-medium">REC</span>
                <span className="text-muted-foreground text-xs font-mono ml-1">{formatTime(elapsed)}</span>
              </div>
            )}
            {questionTimer !== null && questionTimer > 0 && (
              <span className={cn('text-xs font-bold font-mono', questionTimer <= 10 ? 'text-red-400 animate-pulse' : 'text-orange-400')}>
                ⏱ {questionTimer}s
              </span>
            )}
            {cameraActive && (
              <span className={cn('text-[10px] font-medium px-2 py-0.5 rounded-md', 
                currentEmotion === 'happy' ? 'bg-emerald-500/10 text-emerald-400' : 
                currentEmotion === 'neutral' ? 'bg-blue-500/10 text-blue-400' : 
                'bg-orange-500/10 text-orange-400'
              )}>
                {currentEmotion}
              </span>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleEndSession}
              className="text-red-400 hover:text-red-300 hover:bg-red-400/10 text-xs h-7 px-3"
            >
              End Session
            </Button>
          </div>
        </div>
      </div>

      {/* Main content — fills remaining space */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left panel: Question + Transcript (takes most space) */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <AnimatePresence mode="wait">
            {/* Question + Reading countdown / Answer area */}
            {currentQuestion && (
              <motion.div
                key={currentQuestion.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex-1 flex flex-col overflow-hidden"
              >
                {/* Question display — large and prominent */}
                <div className="flex-shrink-0 px-6 pt-6 pb-4 lg:px-10">
                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    <span className={cn('rounded-md px-2.5 py-1 text-xs font-bold border', getDifficultyColor(currentQuestion.difficulty_rating))}>
                      Lv.{currentQuestion.difficulty_rating}
                    </span>
                    <span className="bg-primary/10 text-primary rounded-md px-2.5 py-1 text-xs font-medium">
                      {currentQuestion.topic}
                    </span>
                    <span className="bg-accent/10 text-accent rounded-md px-2.5 py-1 text-xs capitalize font-medium">
                      {currentQuestion.bloom_level}
                    </span>
                    {currentQuestion.domain && (
                      <span className="bg-blue-500/10 text-blue-400 rounded-md px-2.5 py-1 text-xs font-medium">
                        {currentQuestion.domain}
                      </span>
                    )}
                  </div>
                  <p className="text-lg md:text-xl lg:text-2xl font-semibold leading-relaxed whitespace-pre-wrap">
                    {currentQuestion.question_text}
                  </p>
                </div>

                {/* Reading countdown overlay or transcript area */}
                <div className="flex-1 flex flex-col min-h-0 px-6 pb-4 lg:px-10">
                  {answerPhase === 'reading' && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex-1 flex flex-col items-center justify-center"
                    >
                      <div className="text-center">
                        <div className="relative inline-flex items-center justify-center mb-4">
                          {/* Circular countdown ring */}
                          <svg className="w-28 h-28 -rotate-90" viewBox="0 0 120 120">
                            <circle cx="60" cy="60" r="52" fill="none" stroke="currentColor" className="text-border/20" strokeWidth="6" />
                            <motion.circle
                              cx="60" cy="60" r="52"
                              fill="none"
                              stroke="url(#countdown-gradient)"
                              strokeWidth="6"
                              strokeLinecap="round"
                              strokeDasharray={2 * Math.PI * 52}
                              initial={{ strokeDashoffset: 0 }}
                              animate={{ strokeDashoffset: 2 * Math.PI * 52 * (1 - readingCountdown / 5) }}
                              transition={{ duration: 0.5 }}
                            />
                            <defs>
                              <linearGradient id="countdown-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="hsl(var(--primary))" />
                                <stop offset="100%" stopColor="hsl(var(--accent))" />
                              </linearGradient>
                            </defs>
                          </svg>
                          <span className="absolute text-4xl font-black text-primary">
                            {readingCountdown}
                          </span>
                        </div>
                        <p className="text-muted-foreground text-sm flex items-center justify-center gap-2">
                          <Eye className="h-4 w-4" />
                          Read the question — recording starts in {readingCountdown}s
                        </p>
                        <button
                          onClick={handleStartAnswer}
                          className="mt-4 text-xs text-primary/70 hover:text-primary underline transition"
                        >
                          Skip — start answering now
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {(answerPhase === 'answering' || answerPhase === 'idle') && (
                    <div className="flex-1 flex flex-col min-h-0">
                      {/* Transcript area */}
                      <div className="flex-1 bg-card/30 border border-border/20 rounded-xl p-5 overflow-auto min-h-[140px]">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-muted-foreground text-xs font-medium flex items-center gap-1.5">
                            <Mic className="h-3 w-3" />
                            Your Answer
                          </span>
                          {isListening && (
                            <span className="flex items-center gap-1.5 text-xs text-red-400">
                              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-400" />
                              Listening...
                            </span>
                          )}
                        </div>
                        <div className="text-base leading-relaxed">
                          {transcript || interimTranscript ? (
                            <>
                              <span className="text-foreground">{transcript}</span>
                              {interimTranscript && (
                                <span className="text-muted-foreground/50 italic"> {interimTranscript}</span>
                              )}
                            </>
                          ) : (
                            <span className="text-muted-foreground/30 italic">
                              {isListening
                                ? 'Listening… speak your answer clearly'
                                : 'Waiting to start recording...'}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Controls */}
                      <div className="flex-shrink-0 mt-3 flex items-center gap-2">
                        {answerPhase === 'answering' && isListening ? (
                          <>
                            <Button
                              onClick={handleSubmitAnswer}
                              disabled={isSubmitting || (!transcript && !interimTranscript)}
                              className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white h-10 px-6"
                            >
                              {isSubmitting ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Send className="h-4 w-4" />
                              )}
                              Submit Answer
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                stopSTT();
                                stopCamera();
                                setAnswerPhase('idle');
                              }}
                              className="text-red-400 border-red-400/20 hover:bg-red-400/10 h-10"
                            >
                              <Square className="h-3.5 w-3.5 mr-1" />
                              Stop
                            </Button>
                          </>
                        ) : (
                          answerPhase === 'idle' && (
                            <Button
                              onClick={handleStartAnswer}
                              className="from-primary to-accent gap-2 bg-gradient-to-r text-black h-10 px-6"
                              disabled={!currentQuestion}
                            >
                              <Mic className="h-4 w-4" />
                              Start Answering
                            </Button>
                          )
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Result Card */}

          </AnimatePresence>
        </div>

        {/* Right sidebar — Camera + Progress (narrower) */}
        <div className="hidden lg:flex flex-col w-72 xl:w-80 border-l border-border/20 bg-card/20 flex-shrink-0">
          {/* Camera feed */}
          <div className="flex-shrink-0 p-3">
            <div className="relative rounded-xl overflow-hidden bg-black aspect-[4/3]">
              <video
                ref={videoRef}
                muted
                playsInline
                className="h-full w-full object-cover"
              />
              {!cameraActive && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                  <CameraOff className="text-muted-foreground/20 h-8 w-8" />
                  <p className="text-muted-foreground/30 text-[10px] text-center px-4">
                    {answerPhase === 'reading'
                      ? 'Camera starts after countdown'
                      : 'Camera activates when answering'}
                  </p>
                </div>
              )}
              {cameraActive && (
                <div className="absolute bottom-2 left-2 rounded-lg bg-black/70 backdrop-blur-sm px-2.5 py-1 text-[10px] text-white font-medium flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  {currentEmotion}
                </div>
              )}
            </div>
          </div>

          {/* Session progress */}
          <div className="flex-1 overflow-auto px-3 pb-3">
            <div className="bg-card/40 border border-border/20 rounded-xl p-3">
              <h3 className="mb-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Progress
              </h3>
              <div className="space-y-1.5">
                {results.map((r, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <span className="text-muted-foreground/70 font-mono w-6">Q{i + 1}</span>
                    <div className="flex-1 h-1.5 rounded-full bg-border/20 overflow-hidden">
                      <div
                        className={cn('h-full rounded-full transition-all', getScoreBarColor(r.scores.composite))}
                        style={{ width: `${r.scores.composite * 100}%` }}
                      />
                    </div>
                    <span className={cn('font-mono text-[10px] font-bold w-8 text-right', getScoreColor(r.scores.composite))}>
                      {Math.round(r.scores.composite * 100)}%
                    </span>
                  </div>
                ))}
                {results.length === 0 && (
                  <p className="text-muted-foreground/30 text-center text-[10px] italic py-4">
                    Scores will appear here
                  </p>
                )}
              </div>
            </div>

            {/* Status indicators */}
            <div className="mt-3 bg-card/40 border border-border/20 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-muted-foreground">STT</span>
                {sttSupported ? (
                  <span className="flex items-center gap-1 text-emerald-400">
                    <CheckCircle2 className="h-2.5 w-2.5" />
                    Ready
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-red-400">
                    <XCircle className="h-2.5 w-2.5" />
                    N/A
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-muted-foreground">Camera</span>
                {cameraActive ? (
                  <span className="flex items-center gap-1 text-emerald-400">
                    <Camera className="h-2.5 w-2.5" />
                    Active
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-muted-foreground/40">
                    <CameraOff className="h-2.5 w-2.5" />
                    Off
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-muted-foreground">Mode</span>
                <span className="font-medium text-primary">{initData?.mode_config.label}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
