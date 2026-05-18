'use client';

import { motion } from 'framer-motion';
import {
  Award,
  BarChart3,
  BookOpen,
  Brain,
  Briefcase,
  Calendar,
  ChevronRight,
  Code2,
  Edit3,
  ExternalLink,
  Eye,
  FileText,
  FolderKanban,
  GraduationCap,
  Loader2,
  Save,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  Trophy,
  Upload,
  User2,
  X,
  Zap,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { getUserProfile, updateUserProfile, uploadResume } from '@/lib/api-client';
import { Routes } from '@/lib/routes';
import { cn } from '@/lib/utils';

const DOMAINS = [
  { id: 'javascript', label: 'JavaScript', icon: '🟨' },
  { id: 'Machine Learning', label: 'ML', icon: '🤖' },
  { id: 'Operating Systems', label: 'OS', icon: '🖥️' },
  { id: 'Computer Networks', label: 'CN', icon: '🌐' },
  { id: 'OOPs', label: 'OOPs', icon: '🧱' },
  { id: 'DBMS', label: 'DBMS', icon: '🗄️' },
];

const DOMAIN_COLORS: Record<string, string> = {
  'javascript': 'from-yellow-500/30 to-amber-500/20 border-yellow-500/40',
  'Machine Learning': 'from-purple-500/30 to-pink-500/20 border-purple-500/40',
  'Operating Systems': 'from-blue-500/30 to-cyan-500/20 border-blue-500/40',
  'Computer Networks': 'from-green-500/30 to-emerald-500/20 border-green-500/40',
  'OOPs': 'from-red-500/30 to-orange-500/20 border-red-500/40',
  'DBMS': 'from-indigo-500/30 to-violet-500/20 border-indigo-500/40',
};

function getRankInfo(rating: number) {
  if (rating >= 2400) return { label: 'Grandmaster', color: 'text-red-400', bg: 'bg-red-500/20' };
  if (rating >= 2000) return { label: 'Master', color: 'text-orange-400', bg: 'bg-orange-500/20' };
  if (rating >= 1600) return { label: 'Expert', color: 'text-violet-400', bg: 'bg-violet-500/20' };
  if (rating >= 1200) return { label: 'Specialist', color: 'text-blue-400', bg: 'bg-blue-500/20' };
  if (rating >= 800) return { label: 'Apprentice', color: 'text-green-400', bg: 'bg-green-500/20' };
  return { label: 'Newbie', color: 'text-gray-400', bg: 'bg-gray-500/20' };
}

export default function ProfilePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editData, setEditData] = useState({
    name: '',
    current_role: '',
    college_or_company: '',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push(Routes.SignIn);
      return;
    }
    if (status !== 'authenticated') return;

    getUserProfile()
      .then((data) => {
        setProfile(data);
        setEditData({
          name: data.name || '',
          current_role: data.current_role || '',
          college_or_company: data.college_or_company || '',
        });
      })
      .catch(() => toast.error('Failed to load profile'))
      .finally(() => setLoading(false));
  }, [status, router]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateUserProfile(editData);
      setProfile((prev: any) => ({ ...prev, ...editData }));
      setEditing(false);
      toast.success('Profile updated');
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      toast.error('Only PDF files are accepted');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File must be under 10MB');
      return;
    }

    setUploading(true);
    try {
      const result = await uploadResume(file);
      toast.success('Resume uploaded and parsed!');
      // Refresh profile to get parsed data
      const updated = await getUserProfile();
      setProfile(updated);
      setEditData({
        name: updated.name || '',
        current_role: updated.current_role || '',
        college_or_company: updated.college_or_company || '',
      });
    } catch (err: any) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <main className="bg-background min-h-[calc(100vh-3.5rem)] flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </main>
      </>
    );
  }

  const rating = profile?.rating?.current_rating || profile?.rating || 1000;
  const rank = getRankInfo(typeof rating === 'object' ? rating.current_rating || 1000 : rating);
  const domains = profile?.domain_preferences || [];
  const badges = profile?.badges || [];
  const stats = profile?.stats || {};
  const skills = profile?.skills || [];
  const education = profile?.education || [];
  const experience = profile?.experience || [];
  const projects = profile?.projects || [];
  const resumeUrl = profile?.resume_url || '';
  const hasResumeParsed = skills.length > 0 || education.length > 0;
  const suggestedDomains = profile?.suggested_domains || [];

  const inputClass =
    'w-full rounded-lg border border-border/50 bg-card/60 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/20';

  return (
    <>
      <Header />
      <main className="bg-background min-h-[calc(100vh-3.5rem)]">
        <div className="w-full px-6 py-8 lg:px-10">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Left: User Card + Edit */}
            <div className="space-y-4">
              {/* Profile Card */}
              <div className="bg-card/60 border-border/30 rounded-xl border p-6 text-center relative">
                {!editing && (
                  <button
                    onClick={() => setEditing(true)}
                    className="absolute top-3 right-3 p-1.5 rounded-md hover:bg-card/80 transition text-muted-foreground hover:text-foreground"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                  </button>
                )}
                <div className="from-primary/20 to-accent/20 mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br">
                  <User2 className="text-primary h-8 w-8" />
                </div>

                {editing ? (
                  <div className="text-left space-y-3 mt-4">
                    <div>
                      <label className="text-muted-foreground mb-1 block text-[10px] font-medium uppercase tracking-wider">Name</label>
                      <input
                        value={editData.name}
                        onChange={(e) => setEditData((d) => ({ ...d, name: e.target.value }))}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className="text-muted-foreground mb-1 block text-[10px] font-medium uppercase tracking-wider">Role</label>
                      <input
                        value={editData.current_role}
                        onChange={(e) => setEditData((d) => ({ ...d, current_role: e.target.value }))}
                        placeholder="e.g. Student, Developer"
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className="text-muted-foreground mb-1 block text-[10px] font-medium uppercase tracking-wider">College / Company</label>
                      <input
                        value={editData.college_or_company}
                        onChange={(e) => setEditData((d) => ({ ...d, college_or_company: e.target.value }))}
                        placeholder="e.g. IIT Delhi, Google"
                        className={inputClass}
                      />
                    </div>
                    <div className="flex gap-2 pt-1">
                      <Button size="sm" onClick={handleSave} disabled={saving} className="from-primary to-accent bg-gradient-to-r text-black text-xs gap-1">
                        {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                        Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setEditing(false)} className="text-xs">
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <h2 className="text-lg font-bold">{profile?.name || 'Anonymous'}</h2>
                    {profile?.current_role && (
                      <p className="text-muted-foreground text-xs">{profile.current_role}</p>
                    )}
                    {profile?.college_or_company && (
                      <p className="text-muted-foreground text-xs">{profile.college_or_company}</p>
                    )}
                    <p className="text-muted-foreground/60 text-[10px] mt-1">
                      {profile?.email || session?.user?.email}
                    </p>
                  </>
                )}
              </div>

              {/* Rating Card */}
              <div className="bg-card/60 border-border/30 rounded-xl border p-5">
                <div className="text-center">
                  <p className="text-muted-foreground text-[10px] uppercase tracking-wider">Rating</p>
                  <p className={cn('text-4xl font-extrabold mt-1', rank.color)}>
                    {typeof rating === 'object' ? rating.current_rating || 1000 : rating}
                  </p>
                  <span className={cn('inline-block mt-1 rounded-full px-3 py-0.5 text-xs font-bold', rank.bg, rank.color)}>
                    {rank.label}
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-lg font-bold">{profile?.sessions_played || 0}</p>
                    <p className="text-muted-foreground text-[10px]">Sessions</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold">{profile?.peak_rating || (typeof rating === 'object' ? rating.current_rating || 1000 : rating)}</p>
                    <p className="text-muted-foreground text-[10px]">Peak</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold">{profile?.streak_current || 0}</p>
                    <p className="text-muted-foreground text-[10px]">Streak</p>
                  </div>
                </div>
              </div>

              {/* Resume Upload */}
              <div className="bg-card/60 border-border/30 rounded-xl border p-5">
                <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  Resume
                  {hasResumeParsed && (
                    <span className="ml-auto text-[10px] font-normal text-green-400 flex items-center gap-1">
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-400" />
                      Parsed
                    </span>
                  )}
                </h3>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={handleResumeUpload}
                />
                <div className="flex flex-col gap-2">
                  {resumeUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full gap-2 text-xs border-primary/30 hover:bg-primary/10"
                      onClick={() => window.open(resumeUrl, '_blank')}
                    >
                      <Eye className="h-3 w-3" />
                      View Resume
                      <ExternalLink className="h-3 w-3 ml-auto opacity-50" />
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-2 text-xs"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Uploading & Parsing…
                      </>
                    ) : (
                      <>
                        <Upload className="h-3 w-3" />
                        {hasResumeParsed ? 'Update Resume & Parse' : 'Upload Resume (PDF)'}
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="space-y-2">
                <Button
                  onClick={() => router.push(Routes.Interview)}
                  className="from-primary to-accent w-full gap-2 bg-gradient-to-r text-black"
                >
                  <Zap className="h-4 w-4" />
                  Start Interview
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push(Routes.History)}
                  className="w-full gap-2"
                >
                  <BarChart3 className="h-4 w-4" />
                  View History
                </Button>
              </div>
            </div>

            {/* Right: Domains + Skills + Education + Performance */}
            <div className="lg:col-span-2 space-y-6">
              {/* Suggested Practice Domains (from resume skills) */}
              {suggestedDomains.length > 0 && (
                <section>
                  <h2 className="mb-3 flex items-center gap-2 text-sm font-bold">
                    <Sparkles className="h-4 w-4 text-primary" />
                    Suggested Practice Domains
                    <span className="text-muted-foreground text-[10px] font-normal ml-1">(based on your skills)</span>
                  </h2>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {suggestedDomains.map((sd: any) => {
                      const domainInfo = DOMAINS.find(d => d.id === sd.domain_id);
                      if (!domainInfo) return null;
                      const colors = DOMAIN_COLORS[sd.domain_id] || 'from-gray-500/30 to-gray-500/20 border-gray-500/40';
                      return (
                        <motion.div
                          key={sd.domain_id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={cn(
                            'rounded-xl border bg-gradient-to-br p-4 cursor-pointer transition-all hover:scale-[1.02]',
                            colors
                          )}
                          onClick={() => router.push(`/interview?domain=${sd.domain_id}`)}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-2xl">{domainInfo.icon}</span>
                              <div>
                                <p className="text-sm font-bold">{domainInfo.label}</p>
                                <p className="text-muted-foreground text-[10px]">
                                  {sd.match_count} skill{sd.match_count !== 1 ? 's' : ''} matched
                                </p>
                              </div>
                            </div>
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {sd.matched_skills.slice(0, 5).map((skill: string) => (
                              <span key={skill} className="bg-background/40 rounded-full px-2 py-0.5 text-[10px] font-medium">
                                {skill}
                              </span>
                            ))}
                            {sd.matched_skills.length > 5 && (
                              <span className="text-muted-foreground text-[10px]">+{sd.matched_skills.length - 5} more</span>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* Domain Preferences */}
              <section>
                <h2 className="mb-3 flex items-center gap-2 text-sm font-bold">
                  <BookOpen className="h-4 w-4 text-primary" />
                  Domain Preferences
                </h2>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
                  {DOMAINS.map((domain) => {
                    const userDomain = domains.find(
                      (d: any) => d.domain_id === domain.id
                    );
                    const isActive = userDomain?.is_selected;
                    return (
                      <div
                        key={domain.id}
                        className={cn(
                          'rounded-xl border p-3 text-center transition',
                          isActive
                            ? 'border-primary/40 bg-primary/5'
                            : 'border-border/20 bg-card/30 opacity-50'
                        )}
                      >
                        <span className="text-2xl">{domain.icon}</span>
                        <p className="mt-1 text-xs font-semibold">{domain.label}</p>
                        {userDomain?.experience_level && (
                          <p className="text-muted-foreground text-[10px] capitalize mt-0.5">
                            {userDomain.experience_level}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Skills */}
              <section>
                <h2 className="mb-3 flex items-center gap-2 text-sm font-bold">
                  <Code2 className="h-4 w-4 text-primary" />
                  Skills ({skills.length})
                </h2>
                {skills.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {skills.map((skill: string, i: number) => (
                      <motion.span
                        key={skill}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.02 }}
                        className="bg-primary/10 text-primary border border-primary/20 rounded-full px-3 py-1 text-xs font-medium"
                      >
                        {skill}
                      </motion.span>
                    ))}
                  </div>
                ) : (
                  <div className="bg-card/40 border-border/20 rounded-xl border p-6 text-center">
                    <Code2 className="mx-auto h-6 w-6 text-muted-foreground/30" />
                    <p className="text-muted-foreground text-xs mt-2">
                      No skills yet. Upload your resume or add them manually!
                    </p>
                  </div>
                )}
              </section>

              {/* Education */}
              <section>
                <h2 className="mb-3 flex items-center gap-2 text-sm font-bold">
                  <GraduationCap className="h-4 w-4 text-primary" />
                  Education
                </h2>
                {education.length > 0 ? (
                  <div className="space-y-2">
                    {education.map((edu: any, i: number) => (
                      <div key={i} className="bg-card/60 border-border/30 rounded-lg border p-3">
                        <p className="text-sm font-semibold">
                          {typeof edu === 'string' ? edu : edu.degree || edu.institution || edu}
                        </p>
                        {typeof edu === 'object' && edu.institution && edu.degree && (
                          <p className="text-muted-foreground text-xs">{edu.institution}</p>
                        )}
                        {typeof edu === 'object' && (edu.end_year || edu.year) && (
                          <p className="text-muted-foreground/60 text-[10px]">
                            {edu.start_year ? `${edu.start_year} - ${edu.end_year || 'Present'}` : edu.year || edu.end_year}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-card/40 border-border/20 rounded-xl border p-6 text-center">
                    <GraduationCap className="mx-auto h-6 w-6 text-muted-foreground/30" />
                    <p className="text-muted-foreground text-xs mt-2">
                      No education listed. Upload your resume to auto-fill!
                    </p>
                  </div>
                )}
              </section>

              {/* Experience */}
              <section>
                <h2 className="mb-3 flex items-center gap-2 text-sm font-bold">
                  <Briefcase className="h-4 w-4 text-primary" />
                  Experience
                </h2>
                {experience.length > 0 ? (
                  <div className="space-y-2">
                    {experience.map((exp: any, i: number) => (
                      <div key={i} className="bg-card/60 border-border/30 rounded-lg border p-3">
                        <p className="text-sm font-semibold">
                          {typeof exp === 'string' ? exp : exp.title || exp.company || exp}
                        </p>
                        {typeof exp === 'object' && exp.company && exp.title && (
                          <p className="text-muted-foreground text-xs">{exp.company}</p>
                        )}
                        {typeof exp === 'object' && exp.duration && (
                          <p className="text-muted-foreground/60 text-[10px]">{exp.duration}</p>
                        )}
                        {typeof exp === 'object' && exp.description && (
                          <p className="text-muted-foreground text-[11px] mt-1 leading-relaxed">{exp.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-card/40 border-border/20 rounded-xl border p-6 text-center">
                    <Briefcase className="mx-auto h-6 w-6 text-muted-foreground/30" />
                    <p className="text-muted-foreground text-xs mt-2">
                      No experience listed. Upload your resume to auto-fill!
                    </p>
                  </div>
                )}
              </section>

              {/* Projects */}
              <section>
                <h2 className="mb-3 flex items-center gap-2 text-sm font-bold">
                  <FolderKanban className="h-4 w-4 text-primary" />
                  Projects ({projects.length})
                </h2>
                {projects.length > 0 ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {projects.map((proj: any, i: number) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="bg-card/60 border-border/30 rounded-lg border p-3"
                      >
                        <p className="text-sm font-semibold">
                          {typeof proj === 'string' ? proj : proj.name || proj}
                        </p>
                        {typeof proj === 'object' && proj.description && (
                          <p className="text-muted-foreground text-[11px] mt-1 leading-relaxed line-clamp-3">
                            {proj.description}
                          </p>
                        )}
                        {typeof proj === 'object' && proj.technologies && (
                          <p className="text-primary/70 text-[10px] mt-1.5 font-medium">
                            {proj.technologies}
                          </p>
                        )}
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-card/40 border-border/20 rounded-xl border p-6 text-center">
                    <FolderKanban className="mx-auto h-6 w-6 text-muted-foreground/30" />
                    <p className="text-muted-foreground text-xs mt-2">
                      No projects listed. Upload your resume to auto-fill!
                    </p>
                  </div>
                )}
              </section>

              {/* Badges */}
              <section>
                <h2 className="mb-3 flex items-center gap-2 text-sm font-bold">
                  <Trophy className="h-4 w-4 text-primary" />
                  Badges ({badges.length})
                </h2>
                {badges.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {badges.map((badge: string, i: number) => (
                      <motion.div
                        key={badge}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.05 }}
                        className="bg-primary/10 border-primary/20 rounded-lg border px-3 py-2 text-center"
                      >
                        <Award className="mx-auto h-5 w-5 text-primary" />
                        <p className="text-[10px] font-medium mt-1">{badge}</p>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-card/40 border-border/20 rounded-xl border p-8 text-center">
                    <Trophy className="mx-auto h-8 w-8 text-muted-foreground/30" />
                    <p className="text-muted-foreground text-xs mt-2">
                      No badges yet. Complete interviews to earn badges!
                    </p>
                  </div>
                )}
              </section>

              {/* Interview Stats */}
              <section>
                <h2 className="mb-3 flex items-center gap-2 text-sm font-bold">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  Performance
                </h2>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[
                    {
                      label: 'Total Sessions',
                      value: stats.total_sessions || profile?.sessions_played || 0,
                      icon: Target,
                    },
                    {
                      label: 'Avg. Score',
                      value: stats.avg_score
                        ? `${Math.round(stats.avg_score * 100)}%`
                        : '—',
                      icon: Star,
                    },
                    {
                      label: 'Questions Answered',
                      value: stats.total_questions || 0,
                      icon: Brain,
                    },
                    {
                      label: 'Best Streak',
                      value: profile?.streak_current || 0,
                      icon: TrendingUp,
                    },
                  ].map((stat) => {
                    const Icon = stat.icon;
                    return (
                      <div
                        key={stat.label}
                        className="bg-card/60 border-border/30 rounded-xl border p-4"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div className="bg-primary/10 flex h-7 w-7 items-center justify-center rounded-lg">
                            <Icon className="h-3.5 w-3.5 text-primary" />
                          </div>
                        </div>
                        <p className="text-xl font-bold">{stat.value}</p>
                        <p className="text-muted-foreground text-[10px]">{stat.label}</p>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Account Info */}
              <section>
                <h2 className="mb-3 flex items-center gap-2 text-sm font-bold">
                  <Calendar className="h-4 w-4 text-primary" />
                  Account Info
                </h2>
                <div className="bg-card/60 border-border/30 rounded-xl border p-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Experience Level</span>
                    <span className="font-medium capitalize">{profile?.experience_level || '—'}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Member Since</span>
                    <span className="font-medium">
                      {profile?.created_at
                        ? new Date(profile.created_at).toLocaleDateString()
                        : '—'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Active Domains</span>
                    <span className="font-medium">
                      {domains.filter((d: any) => d.is_selected).length} / {DOMAINS.length}
                    </span>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
