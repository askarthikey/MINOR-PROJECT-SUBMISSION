'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  FileText,
  FileUp,
  Layers,
  Loader2,
  Upload,
  User2,
  Zap,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { completeOnboarding, uploadResume } from '@/lib/api-client';
import { Routes } from '@/lib/routes';

/* ─── Constants ─────────────────────────────────────────────────────── */

const STEPS = [
  { icon: User2, title: 'About You', subtitle: 'Tell us a bit about yourself' },
  { icon: FileUp, title: 'Resume', subtitle: 'Upload your resume (optional)' },
  { icon: Layers, title: 'Domains', subtitle: 'Select your interview domains' },
  { icon: BookOpen, title: 'Experience', subtitle: 'Rate your experience per domain' },
];

const DOMAINS = [
  { id: 'javascript', label: 'JavaScript', icon: '🟨', desc: 'Core JS, async, closures, DOM', keywords: ['javascript', 'js', 'node', 'react', 'vue', 'angular', 'typescript', 'express', 'nextjs', 'next.js'] },
  { id: 'Machine Learning', label: 'Machine Learning', icon: '🤖', desc: 'ML algorithms, deep learning, NLP', keywords: ['machine learning', 'ml', 'deep learning', 'tensorflow', 'pytorch', 'neural', 'nlp', 'computer vision', 'scikit', 'keras'] },
  { id: 'Operating Systems', label: 'Operating Systems', icon: '🖥️', desc: 'Processes, memory, scheduling', keywords: ['operating system', 'os', 'linux', 'kernel', 'scheduling', 'memory management', 'threading', 'deadlock'] },
  { id: 'Computer Networks', label: 'Computer Networks', icon: '🌐', desc: 'TCP/IP, HTTP, routing, DNS', keywords: ['networking', 'tcp', 'http', 'dns', 'routing', 'socket', 'udp', 'osi', 'ip', 'network'] },
  { id: 'OOPs', label: 'OOPs', icon: '🧱', desc: 'SOLID, design patterns, inheritance', keywords: ['oop', 'oops', 'design pattern', 'solid', 'abstraction', 'encapsulation', 'polymorphism', 'inheritance', 'java', 'c++'] },
  { id: 'DBMS', label: 'DBMS', icon: '🗄️', desc: 'SQL, normalization, transactions', keywords: ['sql', 'database', 'dbms', 'mysql', 'postgresql', 'mongodb', 'nosql', 'normalization', 'transaction', 'redis'] },
];

const EXPERIENCE_LEVELS = [
  { value: 'beginner', label: 'Beginner', sublabel: '0–1 years', emoji: '🌱', desc: 'Learning the basics', rating: '800' },
  { value: 'intermediate', label: 'Intermediate', sublabel: '1–3 years', emoji: '🌿', desc: 'Working knowledge', rating: '1200' },
  { value: 'advanced', label: 'Advanced', sublabel: '3+ years', emoji: '🌳', desc: 'Deep expertise', rating: '1800' },
];

/* ─── Helper: infer domains from skills ─────────────────────────────── */

function inferDomainsFromSkills(skills: string[]): Set<string> {
  const lower = skills.map((s) => s.toLowerCase());
  const matched = new Set<string>();
  for (const domain of DOMAINS) {
    for (const kw of domain.keywords) {
      if (lower.some((s) => s.includes(kw))) {
        matched.add(domain.id);
        break;
      }
    }
  }
  // Always include at least javascript
  if (matched.size === 0) matched.add('javascript');
  return matched;
}

/* ─── Component ─────────────────────────────────────────────────────── */

export default function OnboardPage() {
  const router = useRouter();
  const { data: session, update } = useSession();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  // Form state
  const [displayName, setDisplayName] = useState('');
  const [currentRole, setCurrentRole] = useState('');
  const [collegeOrCompany, setCollegeOrCompany] = useState('');

  // Resume state
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeUploading, setResumeUploading] = useState(false);
  const [resumeUploaded, setResumeUploaded] = useState(false);
  const [resumeUrl, setResumeUrl] = useState('');
  const [parsedSkills, setParsedSkills] = useState<string[]>([]);
  const [parsedEducation, setParsedEducation] = useState<any[]>([]);
  const [parsedExperience, setParsedExperience] = useState<any[]>([]);
  const [parsedProjects, setParsedProjects] = useState<any[]>([]);

  // Domain & experience
  const [selectedDomains, setSelectedDomains] = useState<Set<string>>(new Set(['javascript']));
  const [domainExperience, setDomainExperience] = useState<Record<string, string>>({});
  const [overallExperience, setOverallExperience] = useState('beginner');

  // Hydrate display name from session
  useEffect(() => {
    if (session?.user?.name && !displayName) {
      setDisplayName(session.user.name);
    }
  }, [session?.user?.name]);

  const toggleDomain = useCallback((domainId: string) => {
    setSelectedDomains((prev) => {
      const next = new Set(prev);
      if (next.has(domainId)) next.delete(domainId);
      else next.add(domainId);
      return next;
    });
  }, []);

  const handleResumeUpload = async () => {
    if (!resumeFile) return;
    setResumeUploading(true);
    try {
      const result = await uploadResume(resumeFile);
      setResumeUploaded(true);

      // Store Cloudinary URL for iframe
      if (result.resume_url) {
        setResumeUrl(result.resume_url);
      }

      // Store parsed data
      if (result.parsed) {
        if (result.parsed.skills?.length) {
          setParsedSkills(result.parsed.skills);
          // Auto-select domains based on skills
          const inferred = inferDomainsFromSkills(result.parsed.skills);
          setSelectedDomains(inferred);
        }
        if (result.parsed.education?.length) setParsedEducation(result.parsed.education);
        if (result.parsed.experience?.length) setParsedExperience(result.parsed.experience);
        if (result.parsed.projects?.length) setParsedProjects(result.parsed.projects);
      }

      toast.success('Resume uploaded & parsed successfully!');
    } catch {
      toast.error('Resume upload failed. You can skip this step.');
    } finally {
      setResumeUploading(false);
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      const domainPreferences = Array.from(selectedDomains).map((domainId) => ({
        domain_id: domainId,
        experience_level: domainExperience[domainId] || overallExperience,
        is_selected: true,
      }));

      await completeOnboarding({
        name: displayName,
        experience_level: overallExperience,
        domain_preferences: domainPreferences,
        current_role: currentRole,
        college_or_company: collegeOrCompany,
        skills: parsedSkills,
      });

      // Force-refresh the JWT token with the new onboarding flag
      await update({ onboardingComplete: true });

      toast.success("Onboarding complete! Let's begin.");
      router.push(Routes.Interview);
    } catch (err: any) {
      toast.error(err.message || 'Onboarding failed');
    } finally {
      setLoading(false);
    }
  };

  const canNext = () => {
    switch (step) {
      case 0: return displayName.trim().length >= 2;
      case 1: return true; // Resume is optional
      case 2: return selectedDomains.size > 0;
      case 3: return overallExperience !== '';
      default: return true;
    }
  };

  return (
    <>
      <Header />
      <main className="bg-background min-h-[calc(100vh-3.5rem)]">
        <div className="w-full max-w-3xl mx-auto px-6 py-10">
          {/* ── Progress bar ── */}
          <div className="mb-8 flex items-center gap-2">
            {STEPS.map((s, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
                <div className="flex w-full items-center gap-1">
                  <div
                    className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                      i <= step ? 'bg-primary' : 'bg-border/30'
                    }`}
                  />
                </div>
                <span className={`text-[10px] font-medium transition-colors ${
                  i <= step ? 'text-primary' : 'text-muted-foreground/50'
                }`}>
                  {s.title}
                </span>
              </div>
            ))}
          </div>

          {/* ── Step header ── */}
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
              {(() => {
                const Icon = STEPS[step].icon;
                return <Icon className="text-primary h-5 w-5" />;
              })()}
            </div>
            <div>
              <p className="text-muted-foreground text-[11px] font-medium">
                Step {step + 1} of {STEPS.length}
              </p>
              <h2 className="text-lg font-bold text-foreground">{STEPS[step].title}</h2>
              <p className="text-muted-foreground text-xs">{STEPS[step].subtitle}</p>
            </div>
          </div>

          {/* ── Step content ── */}
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
            >
              {/* ── Step 0: About You ── */}
              {step === 0 && (
                <div className="space-y-4">
                  <InputField
                    label="Display Name *"
                    value={displayName}
                    onChange={setDisplayName}
                    placeholder="How should we call you?"
                    autoFocus
                  />
                  <InputField
                    label="Current Role (optional)"
                    value={currentRole}
                    onChange={setCurrentRole}
                    placeholder="e.g. Student, Frontend Developer"
                  />
                  <InputField
                    label="College / Company (optional)"
                    value={collegeOrCompany}
                    onChange={setCollegeOrCompany}
                    placeholder="e.g. IIT Delhi, Google"
                  />
                </div>
              )}

              {/* ── Step 1: Resume Upload ── */}
              {step === 1 && (
                <div className="space-y-5">
                  {/* Upload zone */}
                  <div
                    className={`rounded-xl border-2 border-dashed p-8 text-center transition-all ${
                      resumeUploaded
                        ? 'border-green-500/40 bg-green-500/5'
                        : 'border-border/40 bg-card/30 hover:border-primary/30'
                    }`}
                  >
                    {resumeUploaded ? (
                      <div className="flex flex-col items-center gap-2">
                        <CheckCircle2 className="h-10 w-10 text-green-500" />
                        <p className="text-sm font-semibold text-green-400">
                          Resume uploaded & parsed!
                        </p>
                        <p className="text-muted-foreground text-xs">{resumeFile?.name}</p>
                        {parsedSkills.length > 0 && (
                          <div className="mt-3">
                            <p className="text-xs text-muted-foreground mb-2">
                              Extracted {parsedSkills.length} skills:
                            </p>
                            <div className="flex flex-wrap gap-1.5 justify-center max-w-md mx-auto">
                              {parsedSkills.slice(0, 15).map((skill) => (
                                <span
                                  key={skill}
                                  className="bg-primary/10 text-primary border border-primary/20 rounded-full px-2.5 py-0.5 text-[10px] font-medium"
                                >
                                  {skill}
                                </span>
                              ))}
                              {parsedSkills.length > 15 && (
                                <span className="text-muted-foreground text-[10px] px-2 py-0.5">
                                  +{parsedSkills.length - 15} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <>
                        <Upload className="text-muted-foreground mx-auto mb-3 h-8 w-8" />
                        <p className="text-sm font-medium text-foreground">
                          Drop your resume PDF here
                        </p>
                        <p className="text-muted-foreground mt-1 text-xs">
                          We'll extract skills, education & experience and suggest domains automatically
                        </p>
                        <label className="mt-4 inline-block cursor-pointer">
                          <input
                            type="file"
                            accept=".pdf"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) setResumeFile(file);
                            }}
                          />
                          <span className="border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg border px-5 py-2 text-xs font-semibold transition-colors">
                            Choose File
                          </span>
                        </label>
                      </>
                    )}
                  </div>

                  {/* File selected → upload button */}
                  {resumeFile && !resumeUploaded && (
                    <div className="flex items-center justify-between rounded-lg border border-border/30 bg-card/40 px-4 py-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="h-4 w-4 text-primary shrink-0" />
                        <span className="text-xs truncate text-foreground">{resumeFile.name}</span>
                        <span className="text-[10px] text-muted-foreground shrink-0">
                          ({(resumeFile.size / 1024).toFixed(0)} KB)
                        </span>
                      </div>
                      <Button
                        size="sm"
                        onClick={handleResumeUpload}
                        disabled={resumeUploading}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs shrink-0"
                      >
                        {resumeUploading ? (
                          <>
                            <Loader2 className="h-3 w-3 animate-spin mr-1" />
                            Parsing…
                          </>
                        ) : (
                          'Upload & Parse'
                        )}
                      </Button>
                    </div>
                  )}

                  {/* Resume iframe preview */}
                  {/*
                  {resumeUrl && (
                    <div className="rounded-xl border border-border/30 overflow-hidden">
                      <div className="bg-card/60 px-4 py-2 border-b border-border/30 flex items-center gap-2">
                        <FileText className="h-3.5 w-3.5 text-primary" />
                        <span className="text-xs font-medium text-foreground">Resume Preview</span>
                      </div>
                      <iframe
                        src={resumeUrl}
                        className="w-full h-[400px] bg-white"
                        title="Resume Preview"
                      />
                    </div>
                  )}
                  */}

                  <p className="text-muted-foreground text-center text-[11px]">
                    This step is optional — you can skip and fill details manually later
                  </p>
                </div>
              )}

              {/* ── Step 2: Domain Selection ── */}
              {step === 2 && (
                <div className="space-y-4">
                  {parsedSkills.length > 0 && (
                    <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                      <p className="text-xs text-primary font-medium">
                        ✨ Domains pre-selected based on your resume skills
                      </p>
                    </div>
                  )}
                  <p className="text-muted-foreground text-xs">
                    Select the domains you want to practice. You can change this anytime.
                  </p>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {DOMAINS.map((domain) => {
                      const isSelected = selectedDomains.has(domain.id);
                      return (
                        <motion.button
                          key={domain.id}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => toggleDomain(domain.id)}
                          className={`relative rounded-xl border p-4 text-left transition-all ${
                            isSelected
                              ? 'border-primary bg-primary/8 ring-1 ring-primary/30'
                              : 'border-border/30 bg-card/40 hover:border-border/60 hover:bg-card/60'
                          }`}
                        >
                          <span className="text-2xl">{domain.icon}</span>
                          <p className="mt-2 text-sm font-semibold text-foreground">{domain.label}</p>
                          <p className="text-muted-foreground mt-0.5 text-[10px]">{domain.desc}</p>
                          {isSelected && (
                            <div className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground font-bold">
                              ✓
                            </div>
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                  <p className="text-muted-foreground text-center text-xs mt-2">
                    {selectedDomains.size} domain{selectedDomains.size !== 1 ? 's' : ''} selected
                  </p>
                </div>
              )}

              {/* ── Step 3: Experience Level ── */}
              {step === 3 && (
                <div className="space-y-6">
                  <div>
                    <p className="text-muted-foreground text-xs mb-4">
                      Set your overall experience level. This determines your starting rating.
                    </p>
                    <div className="grid grid-cols-3 gap-3">
                      {EXPERIENCE_LEVELS.map((level) => (
                        <button
                          key={level.value}
                          onClick={() => setOverallExperience(level.value)}
                          className={`rounded-xl border p-4 text-center transition-all ${
                            overallExperience === level.value
                              ? 'border-primary bg-primary/10 ring-1 ring-primary/30'
                              : 'border-border/40 bg-card/40 hover:border-border/60'
                          }`}
                        >
                          <span className="text-3xl">{level.emoji}</span>
                          <p className="mt-2 text-sm font-bold text-foreground">{level.label}</p>
                          <p className="text-muted-foreground text-[10px]">{level.sublabel}</p>
                          <p className="text-muted-foreground/60 text-[10px] mt-1">{level.desc}</p>
                          <p className="text-primary text-[10px] mt-1 font-semibold">
                            Rating: {level.rating}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Per-domain fine-tune */}
                  {selectedDomains.size > 1 && (
                    <div className="rounded-xl border border-border/30 bg-card/40 p-4">
                      <p className="text-xs font-semibold mb-3 text-foreground">
                        Fine-tune per domain (optional)
                      </p>
                      <div className="space-y-2.5">
                        {Array.from(selectedDomains).map((domainId) => {
                          const domain = DOMAINS.find((d) => d.id === domainId);
                          if (!domain) return null;
                          return (
                            <div key={domainId} className="flex items-center justify-between gap-3">
                              <span className="text-xs text-foreground">
                                {domain.icon} {domain.label}
                              </span>
                              <div className="flex gap-1">
                                {EXPERIENCE_LEVELS.map((level) => (
                                  <button
                                    key={level.value}
                                    onClick={() =>
                                      setDomainExperience((prev) => ({
                                        ...prev,
                                        [domainId]: level.value,
                                      }))
                                    }
                                    className={`rounded-md px-2.5 py-1 text-[10px] font-medium transition ${
                                      (domainExperience[domainId] || overallExperience) ===
                                      level.value
                                        ? 'bg-primary/20 text-primary'
                                        : 'text-muted-foreground hover:bg-card/80 hover:text-foreground'
                                    }`}
                                  >
                                    {level.emoji} {level.label}
                                  </button>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* ── Navigation ── */}
          <div className="mt-8 flex justify-between">
            <Button
              variant="outline"
              onClick={() => setStep((s) => s - 1)}
              disabled={step === 0}
              className="gap-1.5 border-border/40 text-foreground hover:bg-card/60"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </Button>

            {step < STEPS.length - 1 ? (
              <Button
                onClick={() => setStep((s) => s + 1)}
                disabled={!canNext()}
                className="gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                Next
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            ) : (
              <Button
                onClick={handleComplete}
                disabled={!canNext() || loading}
                className="gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    <Zap className="h-3.5 w-3.5" />
                    Start Training
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </main>
    </>
  );
}

/* ─── Reusable Input ────────────────────────────────────────────────── */

function InputField({
  label,
  value,
  onChange,
  placeholder,
  autoFocus,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  autoFocus?: boolean;
}) {
  return (
    <div>
      <label className="text-muted-foreground mb-1.5 block text-xs font-medium">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="w-full rounded-lg border border-border/50 bg-card/60 px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
      />
    </div>
  );
}
