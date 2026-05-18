'use client';

import { motion } from 'framer-motion';
import {
  AlertCircle,
  ArrowLeft,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  User,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getSession, signIn } from 'next-auth/react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Routes } from '@/lib/routes';

export default function SignInPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (mode === 'register' && password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (mode === 'register' && password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      const result = await signIn('credentials', {
        email,
        password,
        username: mode === 'register' ? username : undefined,
        mode,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error);
      } else if (result?.ok) {
        toast.success(mode === 'login' ? 'Welcome back!' : 'Account created!');
        // Check if user needs onboarding
        const session = await getSession();
        if (session && !(session as any).onboardingComplete) {
          router.push('/onboard');
        } else {
          router.push(Routes.Dashboard);
        }
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full rounded-lg border border-border/50 bg-card/80 px-3 py-2.5 pl-10 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/20';

  return (
    <div className="bg-background text-foreground flex min-h-screen">
      {/* Left decorative panel */}
      <div className="from-primary/10 via-accent/5 hidden flex-1 items-center justify-center bg-gradient-to-br to-transparent lg:flex">
        <div className="max-w-sm text-center">
          <div className="from-primary to-accent mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br">
            <Zap className="h-8 w-8 text-black" />
          </div>
          <h2 className="text-2xl font-bold">Gamified Interview Trainer</h2>
          <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
            AI-powered mock interviews with voice recognition, emotion analysis, and adaptive
            difficulty. Get scored like a real interview.
          </p>
          <div className="mt-8 space-y-3">
            {['Voice-to-text answers', 'Multi-model AI scoring', '8 rating tiers'].map(
              (text, i) => (
                <motion.div
                  key={text}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="bg-card/40 border-border/20 flex items-center gap-2.5 rounded-lg border px-4 py-2.5 text-xs"
                >
                  <div className="bg-primary/20 flex h-5 w-5 items-center justify-center rounded-full">
                    <div className="bg-primary h-1.5 w-1.5 rounded-full" />
                  </div>
                  {text}
                </motion.div>
              )
            )}
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-sm"
        >
          <Link
            href={Routes.Home}
            className="text-muted-foreground hover:text-foreground mb-8 inline-flex items-center gap-1.5 text-xs transition"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to home
          </Link>

          <h1 className="mt-2 text-xl font-bold">
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </h1>
          <p className="text-muted-foreground mt-1.5 text-xs">
            {mode === 'login'
              ? 'Sign in to continue your training'
              : 'Start your interview training journey'}
          </p>

          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-4 flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2.5 text-xs text-red-400"
            >
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-3.5">
            {mode === 'register' && (
              <div className="relative">
                <User className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className={inputClass}
                  required
                  minLength={3}
                  maxLength={20}
                />
              </div>
            )}

            <div className="relative">
              <Mail className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
                required
              />
            </div>

            <div className="relative">
              <Lock className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-muted-foreground hover:text-foreground absolute right-3 top-1/2 -translate-y-1/2 transition"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {mode === 'register' && (
              <div className="relative">
                <Lock className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
                <input
                  type="password"
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={inputClass}
                  required
                />
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="from-primary to-accent w-full bg-gradient-to-r font-semibold text-black"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {mode === 'login' ? 'Signing in…' : 'Creating account…'}
                </>
              ) : mode === 'login' ? (
                'Sign In'
              ) : (
                'Create Account'
              )}
            </Button>
          </form>

          <div className="mt-5 text-center">
            <button
              type="button"
              onClick={() => {
                setMode(mode === 'login' ? 'register' : 'login');
                setError('');
              }}
              className="text-primary/80 hover:text-primary text-xs font-medium transition"
            >
              {mode === 'login'
                ? "Don't have an account? Sign up"
                : 'Already have an account? Sign in'}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
