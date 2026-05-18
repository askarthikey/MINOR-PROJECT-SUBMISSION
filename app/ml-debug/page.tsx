'use client';

import {
  Activity,
  AlertCircle,
  Brain,
  Camera,
  CheckCircle2,
  FileText,
  Loader2,
  Mic,
  MicOff,
  RefreshCw,
  Search,
  Server,
  Sparkles,
  Target,
  Terminal,
  Upload,
  X,
  Zap,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

const ML_URL = process.env.NEXT_PUBLIC_ML_URL || 'http://localhost:8000';
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';

/* ═══════════════════ Helpers ═══════════════════ */

function LatencyBadge({ ms }: { ms: number | null }) {
  if (ms === null) return null;
  const color = ms < 200 ? 'text-emerald-400' : ms < 1000 ? 'text-yellow-400' : 'text-red-400';
  return <span className={`font-mono text-[10px] ${color}`}>{ms}ms</span>;
}

function JsonViewer({ data, maxH = 'max-h-80' }: { data: any; maxH?: string }) {
  if (data === null || data === undefined) return null;
  return (
    <pre className={`mt-3 ${maxH} overflow-auto rounded-lg border border-white/[0.06] bg-[#030303] p-3.5 text-[11px] leading-relaxed text-emerald-400/90 font-mono scrollbar-thin`}>
      {typeof data === 'string' ? data : JSON.stringify(data, null, 2)}
    </pre>
  );
}

function StatusPill({ ok, label }: { ok: boolean | null; label: string }) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
      <div className="relative">
        {ok === null && <div className="h-3 w-3 rounded-full bg-white/20 animate-pulse" />}
        {ok === true && (
          <>
            <div className="h-3 w-3 rounded-full bg-emerald-400" />
            <div className="absolute inset-0 h-3 w-3 rounded-full bg-emerald-400 animate-ping opacity-30" />
          </>
        )}
        {ok === false && <div className="h-3 w-3 rounded-full bg-red-400" />}
      </div>
      <div>
        <p className="text-[10px] text-white/40 uppercase tracking-widest">{label}</p>
        <p className="text-xs font-bold">
          {ok === null ? 'Checking…' : ok ? 'Online' : 'Offline'}
        </p>
      </div>
    </div>
  );
}

function SectionCard({
  icon: Icon,
  title,
  gradient,
  children,
}: {
  icon: any;
  title: string;
  gradient: string;
  children: React.ReactNode;
}) {
  return (
    <div className="group relative rounded-2xl border border-white/[0.06] bg-white/[0.015] overflow-hidden transition-all duration-300 hover:border-white/[0.12] hover:shadow-2xl hover:shadow-black/20">
      {/* Gradient accent top */}
      <div className={`h-[2px] w-full bg-gradient-to-r ${gradient}`} />
      <div className="p-5">
        <div className="flex items-center gap-2.5 mb-5">
          <div className={`flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br ${gradient} shadow-lg`}>
            <Icon className="h-4 w-4 text-white" />
          </div>
          <h3 className="text-sm font-extrabold tracking-tight">{title}</h3>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ═══════════════════ 1. Face Confidence ═══════════════════ */

function FaceTester() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [latency, setLatency] = useState<number | null>(null);
  const [useWebcam, setUseWebcam] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch {
      setError('Camera access denied');
      setUseWebcam(false);
    }
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => {
    if (useWebcam) startCamera();
    else stopCamera();
    return stopCamera;
  }, [useWebcam, startCamera, stopCamera]);

  const captureAndAnalyze = async () => {
    setLoading(true); setError(''); setResult(null);
    try {
      let blob: Blob;
      if (useWebcam && videoRef.current && canvasRef.current) {
        const canvas = canvasRef.current;
        const video = videoRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d')?.drawImage(video, 0, 0);
        blob = await new Promise<Blob>((r) => canvas.toBlob((b) => r(b!), 'image/jpeg', 0.8));
      } else {
        throw new Error('Use file upload instead');
      }
      const formData = new FormData();
      formData.append('frame', blob, 'frame.jpg');
      const t0 = Date.now();
      const res = await fetch(`${ML_URL}/analyze_frame`, { method: 'POST', body: formData });
      setLatency(Date.now() - t0);
      if (!res.ok) throw new Error(await res.text());
      setResult(await res.json());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true); setError(''); setResult(null);
    try {
      const formData = new FormData();
      formData.append('frame', file);
      const t0 = Date.now();
      const res = await fetch(`${ML_URL}/analyze_frame`, { method: 'POST', body: formData });
      setLatency(Date.now() - t0);
      if (!res.ok) throw new Error(await res.text());
      setResult(await res.json());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <SectionCard icon={Camera} title="Face Emotion Analysis" gradient="from-rose-500 to-pink-600">
      <div className="space-y-3">
        {/* Toggle webcam / file */}
        <div className="flex gap-2">
          {[
            { active: useWebcam, label: 'Webcam', icon: Camera, onClick: () => setUseWebcam(true) },
            { active: !useWebcam, label: 'File', icon: Upload, onClick: () => setUseWebcam(false) },
          ].map((btn) => (
            <button
              key={btn.label}
              onClick={btn.onClick}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition border ${
                btn.active ? 'bg-white/[0.08] text-white border-white/[0.12]' : 'text-white/40 border-transparent hover:text-white/60'
              }`}
            >
              <btn.icon className="h-3 w-3" />
              {btn.label}
            </button>
          ))}
        </div>

        {/* Video preview */}
        {useWebcam && (
          <div className="relative rounded-lg overflow-hidden border border-white/[0.06] bg-black aspect-video">
            <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
            <canvas ref={canvasRef} className="hidden" />
          </div>
        )}

        {/* Action button */}
        {useWebcam ? (
          <button
            onClick={captureAndAnalyze}
            disabled={loading}
            className="w-full rounded-lg bg-gradient-to-r from-rose-500 to-pink-600 px-4 py-2.5 text-xs font-bold text-white transition hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
            {loading ? 'Analyzing…' : 'Capture & Analyze'}
          </button>
        ) : (
          <>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={loading}
              className="w-full rounded-lg bg-gradient-to-r from-rose-500 to-pink-600 px-4 py-2.5 text-xs font-bold text-white transition hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
              {loading ? 'Analyzing…' : 'Upload Image'}
            </button>
          </>
        )}

        <LatencyBadge ms={latency} />

        {/* Results */}
        {result && (
          <div className="space-y-3">
            <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-3 text-center">
              <p className="text-2xl font-black bg-gradient-to-r from-rose-400 to-pink-400 bg-clip-text text-transparent capitalize">{result.emotion}</p>
              <p className="text-[10px] text-white/40 mt-0.5">{(result.confidence * 100).toFixed(1)}% confident</p>
            </div>
            {result.all_emotions && (
              <div className="space-y-1.5">
                {Object.entries(result.all_emotions)
                  .sort(([, a], [, b]) => (b as number) - (a as number))
                  .map(([label, score]) => (
                    <div key={label} className="flex items-center gap-2 text-[11px]">
                      <span className="w-16 text-white/40 capitalize">{label}</span>
                      <div className="h-1.5 flex-1 rounded-full bg-white/[0.04] overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-rose-500 to-pink-500 transition-all" style={{ width: `${(score as number) * 100}%` }} />
                      </div>
                      <span className="font-mono w-12 text-right text-white/50">{((score as number) * 100).toFixed(1)}%</span>
                    </div>
                  ))}
              </div>
            )}
            <JsonViewer data={result} />
          </div>
        )}

        {error && <p className="text-xs text-red-400 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{error}</p>}
      </div>
    </SectionCard>
  );
}

/* ═══════════════════ 2. Speech-to-Text ═══════════════════ */

function STTTester() {
  const [transcript, setTranscript] = useState('');
  const [interim, setInterim] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const recognitionRef = useRef<any>(null);
  const processedIndexRef = useRef(0);

  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { setSupported(false); return; }

    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    let shouldRestart = false;

    recognition.onresult = (event: any) => {
      let interimText = '';
      const startIdx = Math.max(event.resultIndex, processedIndexRef.current);
      for (let i = startIdx; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          setTranscript((prev) => prev + event.results[i][0].transcript + ' ');
          processedIndexRef.current = i + 1;
        } else {
          interimText += event.results[i][0].transcript;
        }
      }
      setInterim(interimText);
    };

    recognition.onend = () => {
      if (shouldRestart) {
        processedIndexRef.current = 0;
        try { recognition.start(); } catch { setIsListening(false); }
      } else {
        setIsListening(false);
      }
    };
    recognition.onerror = () => {};
    recognitionRef.current = recognition;
    (recognition as any).__shouldRestart = (v: boolean) => { shouldRestart = v; };

    return () => { shouldRestart = false; try { recognition.stop(); } catch {} };
  }, []);

  const toggle = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      (recognitionRef.current as any).__shouldRestart(false);
      recognitionRef.current.stop();
      setIsListening(false);
      setInterim('');
    } else {
      processedIndexRef.current = 0;
      (recognitionRef.current as any).__shouldRestart(true);
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  return (
    <SectionCard icon={Mic} title="Speech-to-Text" gradient="from-blue-500 to-cyan-500">
      <div className="space-y-3">
        {!supported ? (
          <p className="text-xs text-red-400">Browser does not support SpeechRecognition API</p>
        ) : (
          <>
            <button
              onClick={toggle}
              className={`w-full rounded-lg px-4 py-2.5 text-xs font-bold text-white transition flex items-center justify-center gap-2 ${
                isListening ? 'bg-red-500/80 hover:bg-red-500' : 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:opacity-90'
              }`}
            >
              {isListening ? <><MicOff className="h-3.5 w-3.5" /> Stop</> : <><Mic className="h-3.5 w-3.5" /> Start Listening</>}
            </button>

            {isListening && (
              <div className="flex items-center gap-2 text-xs text-blue-400">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500" />
                </span>
                Listening…
              </div>
            )}

            <div className="min-h-[80px] rounded-lg border border-white/[0.06] bg-[#030303] p-3 text-xs leading-relaxed">
              {transcript && <span className="text-white/90">{transcript}</span>}
              {interim && <span className="text-white/30 italic">{interim}</span>}
              {!transcript && !interim && (
                <span className="text-white/20 italic">Transcript will appear here…</span>
              )}
            </div>

            <button
              onClick={() => { setTranscript(''); setInterim(''); }}
              className="text-[10px] text-white/30 hover:text-white/60 underline transition"
            >
              Clear transcript
            </button>
          </>
        )}
      </div>
    </SectionCard>
  );
}

/* ═══════════════════ 3. Keyword Matching ═══════════════════ */

function KeywordTester() {
  const [answer, setAnswer] = useState('');
  const [keywords, setKeywords] = useState('');
  const [result, setResult] = useState<any>(null);

  const analyze = () => {
    const kws = keywords.split(',').map((k) => k.trim()).filter(Boolean);
    if (!kws.length || !answer.trim()) return;
    const answerLower = answer.toLowerCase();
    const matched = kws.filter((kw) => answerLower.includes(kw.toLowerCase()));
    const unmatched = kws.filter((kw) => !answerLower.includes(kw.toLowerCase()));
    const coverage = matched.length / kws.length;
    setResult({
      total_keywords: kws.length,
      matched,
      unmatched,
      coverage,
      coverage_pct: `${(coverage * 100).toFixed(1)}%`,
    });
  };

  return (
    <SectionCard icon={Search} title="Keyword Matching" gradient="from-amber-500 to-orange-500">
      <div className="space-y-3">
        <div>
          <label className="text-[10px] font-semibold uppercase tracking-widest text-white/30 mb-1.5 block">User Answer</label>
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Enter the user's answer text..."
            className="w-full rounded-lg border border-white/[0.06] bg-[#030303] px-3 py-2.5 text-xs text-white placeholder:text-white/20 outline-none focus:border-amber-500/40 min-h-[70px] resize-none transition"
          />
        </div>
        <div>
          <label className="text-[10px] font-semibold uppercase tracking-widest text-white/30 mb-1.5 block">Keywords (comma-separated)</label>
          <input
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            placeholder="gradient descent, loss function, backpropagation"
            className="w-full rounded-lg border border-white/[0.06] bg-[#030303] px-3 py-2.5 text-xs text-white placeholder:text-white/20 outline-none focus:border-amber-500/40 transition"
          />
        </div>
        <button
          onClick={analyze}
          disabled={!answer.trim() || !keywords.trim()}
          className="w-full rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2.5 text-xs font-bold text-white transition hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <Target className="h-3.5 w-3.5" /> Check Coverage
        </button>
        {result && (
          <div>
            <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-3 text-center mb-2">
              <p className="text-3xl font-black bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">{result.coverage_pct}</p>
              <p className="text-[10px] text-white/40">{result.matched.length}/{result.total_keywords} matched</p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {result.matched.map((kw: string) => (
                <span key={kw} className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                  <CheckCircle2 className="h-2.5 w-2.5" />{kw}
                </span>
              ))}
              {result.unmatched.map((kw: string) => (
                <span key={kw} className="inline-flex items-center gap-1 rounded-full bg-red-500/10 border border-red-500/20 px-2 py-0.5 text-[10px] font-medium text-red-400">
                  <X className="h-2.5 w-2.5" />{kw}
                </span>
              ))}
            </div>
            <JsonViewer data={result} />
          </div>
        )}
      </div>
    </SectionCard>
  );
}

/* ═══════════════════ 4. Resume Parser ═══════════════════ */

function ResumeParserTester() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [latency, setLatency] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true); setError(''); setResult(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const t0 = Date.now();
      const res = await fetch(`${ML_URL}/parse_resume`, { method: 'POST', body: formData });
      setLatency(Date.now() - t0);
      if (!res.ok) throw new Error(await res.text());
      setResult(await res.json());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <SectionCard icon={FileText} title="Resume Parser" gradient="from-emerald-500 to-teal-500">
      <div className="space-y-3">
        <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={handleUpload} />
        <button
          onClick={() => fileRef.current?.click()}
          disabled={loading}
          className="w-full rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2.5 text-xs font-bold text-white transition hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
          {loading ? 'Parsing…' : 'Upload Resume PDF'}
        </button>
        <LatencyBadge ms={latency} />

        {result && (
          <div className="space-y-2">
            {result.basic_info && (
              <div className="rounded-lg border border-white/[0.06] bg-white/[0.03] p-3">
                <p className="text-xs font-bold mb-1.5 text-emerald-400">Basic Info</p>
                <div className="text-[11px] text-white/50 space-y-0.5">
                  {result.basic_info.name && <p>Name: <span className="text-white/90">{result.basic_info.name}</span></p>}
                  {result.basic_info.email && <p>Email: <span className="text-white/90">{result.basic_info.email}</span></p>}
                  {result.basic_info.phone && <p>Phone: <span className="text-white/90">{result.basic_info.phone}</span></p>}
                </div>
              </div>
            )}
            {result.skills?.length > 0 && (
              <div>
                <p className="text-xs font-bold mb-1.5">Skills ({result.skills.length})</p>
                <div className="flex flex-wrap gap-1">
                  {result.skills.map((s: string) => (
                    <span key={s} className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] text-emerald-400 font-medium">{s}</span>
                  ))}
                </div>
              </div>
            )}
            <JsonViewer data={result} />
          </div>
        )}
        {error && <p className="text-xs text-red-400 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{error}</p>}
      </div>
    </SectionCard>
  );
}

/* ═══════════════════ 5. Question Generator ═══════════════════ */

function QuestionGenTester() {
  const [domain, setDomain] = useState('Machine Learning');
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [latency, setLatency] = useState<number | null>(null);

  const DOMAINS = ['Machine Learning', 'javascript', 'Operating Systems', 'Computer Networks', 'OOPs', 'DBMS'];

  const generate = async () => {
    setLoading(true); setError(''); setResult(null);
    try {
      const t0 = Date.now();
      const res = await fetch(`${BACKEND_URL}/api/sessions/test-generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain, topic: topic || undefined, difficulty }),
      });
      setLatency(Date.now() - t0);
      if (!res.ok) throw new Error(await res.text());
      setResult(await res.json());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SectionCard icon={Sparkles} title="Question Generator" gradient="from-violet-500 to-purple-600">
      <div className="space-y-3">
        <div>
          <label className="text-[10px] font-semibold uppercase tracking-widest text-white/30 mb-1.5 block">Domain</label>
          <select
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            className="w-full rounded-lg border border-white/[0.06] bg-[#030303] px-3 py-2.5 text-xs text-white outline-none focus:border-violet-500/40 transition"
          >
            {DOMAINS.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[10px] font-semibold uppercase tracking-widest text-white/30 mb-1.5 block">Topic (optional)</label>
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Neural Networks, Sorting, TCP/IP…"
            className="w-full rounded-lg border border-white/[0.06] bg-[#030303] px-3 py-2.5 text-xs text-white placeholder:text-white/20 outline-none focus:border-violet-500/40 transition"
          />
        </div>
        <div>
          <label className="text-[10px] font-semibold uppercase tracking-widest text-white/30 mb-1.5 block">Difficulty</label>
          <div className="flex gap-2">
            {['easy', 'medium', 'hard'].map((d) => (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                className={`flex-1 rounded-lg py-2 text-xs font-medium capitalize transition border ${
                  difficulty === d
                    ? 'bg-violet-500/15 text-violet-400 border-violet-500/30'
                    : 'text-white/30 border-white/[0.06] hover:border-white/[0.12] hover:text-white/50'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
        <button
          onClick={generate}
          disabled={loading}
          className="w-full rounded-lg bg-gradient-to-r from-violet-500 to-purple-600 px-4 py-2.5 text-xs font-bold text-white transition hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
          {loading ? 'Generating…' : 'Generate Question'}
        </button>
        <LatencyBadge ms={latency} />

        {result && (
          <div className="space-y-2">
            {(result.question_text || result.question) && (
              <div className="rounded-lg border border-white/[0.06] bg-white/[0.03] p-3">
                <p className="text-xs font-bold mb-1.5 text-violet-400">Question</p>
                <p className="text-[11px] text-white/80 leading-relaxed">{result.question_text || result.question}</p>
              </div>
            )}
            {result.expected_answer && (
              <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
                <p className="text-xs font-bold mb-1.5 text-white/60">Expected Answer</p>
                <p className="text-[11px] text-white/50 leading-relaxed">{result.expected_answer}</p>
              </div>
            )}
            {result.keywords?.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {result.keywords.map((kw: string) => (
                  <span key={kw} className="rounded-full bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 text-[10px] text-violet-400 font-medium">{kw}</span>
                ))}
              </div>
            )}
            <JsonViewer data={result} />
          </div>
        )}
        {error && <p className="text-xs text-red-400 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{error}</p>}
      </div>
    </SectionCard>
  );
}

/* ═══════════════════ 6. Scoring Pipeline ═══════════════════ */

function ScoringTester() {
  const [userAnswer, setUserAnswer] = useState('');
  const [expectedAnswer, setExpectedAnswer] = useState('');
  const [keywords, setKeywords] = useState('');
  const [emotionStr, setEmotionStr] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [latency, setLatency] = useState<number | null>(null);

  const score = async () => {
    setLoading(true); setError(''); setResult(null);
    try {
      const kws = keywords.split(',').map((k) => k.trim()).filter(Boolean);
      let emotion_timeline: any[] = [];
      if (emotionStr.trim()) {
        try { emotion_timeline = JSON.parse(emotionStr); } catch {
          emotion_timeline = emotionStr.split(',').map((e) => {
            const [emotion, conf] = e.trim().split(':');
            return { emotion: emotion || 'neutral', confidence: parseFloat(conf) || 0.5, timestamp: Date.now() };
          });
        }
      }
      const t0 = Date.now();
      const res = await fetch(`${ML_URL}/score_answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_answer: userAnswer, expected_answer: expectedAnswer, keywords: kws, emotion_timeline }),
      });
      setLatency(Date.now() - t0);
      if (!res.ok) throw new Error(await res.text());
      setResult(await res.json());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const barColor = (v: number) => v >= 0.7 ? 'from-emerald-400 to-emerald-500' : v >= 0.4 ? 'from-amber-400 to-amber-500' : 'from-red-400 to-red-500';

  return (
    <SectionCard icon={Brain} title="Scoring Pipeline" gradient="from-indigo-500 to-blue-600">
      <div className="space-y-3">
        <div>
          <label className="text-[10px] font-semibold uppercase tracking-widest text-white/30 mb-1.5 block">User Answer</label>
          <textarea
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            placeholder="The user's spoken answer..."
            className="w-full rounded-lg border border-white/[0.06] bg-[#030303] px-3 py-2.5 text-xs text-white placeholder:text-white/20 outline-none focus:border-indigo-500/40 min-h-[70px] resize-none transition"
          />
        </div>
        <div>
          <label className="text-[10px] font-semibold uppercase tracking-widest text-white/30 mb-1.5 block">Expected Answer</label>
          <textarea
            value={expectedAnswer}
            onChange={(e) => setExpectedAnswer(e.target.value)}
            placeholder="The model/expected answer..."
            className="w-full rounded-lg border border-white/[0.06] bg-[#030303] px-3 py-2.5 text-xs text-white placeholder:text-white/20 outline-none focus:border-indigo-500/40 min-h-[70px] resize-none transition"
          />
        </div>
        <div>
          <label className="text-[10px] font-semibold uppercase tracking-widest text-white/30 mb-1.5 block">Keywords (comma-separated)</label>
          <input
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            placeholder="gradient, loss, backprop"
            className="w-full rounded-lg border border-white/[0.06] bg-[#030303] px-3 py-2.5 text-xs text-white placeholder:text-white/20 outline-none focus:border-indigo-500/40 transition"
          />
        </div>
        <div>
          <label className="text-[10px] font-semibold uppercase tracking-widest text-white/30 mb-1.5 block">
            Emotion Timeline <span className="text-white/15">(optional — e.g. happy:0.8, neutral:0.5)</span>
          </label>
          <input
            value={emotionStr}
            onChange={(e) => setEmotionStr(e.target.value)}
            placeholder="happy:0.8, neutral:0.6, happy:0.9"
            className="w-full rounded-lg border border-white/[0.06] bg-[#030303] px-3 py-2.5 text-xs text-white placeholder:text-white/20 outline-none focus:border-indigo-500/40 transition"
          />
        </div>

        <button
          onClick={score}
          disabled={loading || !userAnswer.trim() || !expectedAnswer.trim()}
          className="w-full rounded-lg bg-gradient-to-r from-indigo-500 to-blue-600 px-4 py-2.5 text-xs font-bold text-white transition hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
          {loading ? 'Scoring…' : 'Score Answer'}
        </button>
        <LatencyBadge ms={latency} />

        {result && (
          <div className="space-y-3">
            {/* Big composite score */}
            <div className="rounded-xl bg-gradient-to-br from-indigo-500/10 to-blue-500/10 border border-indigo-500/20 p-5 text-center">
              <p className="text-5xl font-black bg-gradient-to-r from-indigo-400 to-blue-400 bg-clip-text text-transparent">{(result.composite * 100).toFixed(1)}%</p>
              <p className="text-[10px] text-white/30 mt-1">Composite Score</p>
              {result.dominant_emotion && (
                <p className="text-[10px] text-white/30">Emotion: <span className="text-white/60 capitalize">{result.dominant_emotion}</span></p>
              )}
            </div>

            {/* Score bars */}
            <div className="space-y-2">
              {[
                { label: 'Semantic Similarity', value: result.semantic_similarity, weight: '40%' },
                { label: 'Keyword Coverage', value: result.keyword_coverage, weight: '30%' },
                { label: 'Cross-Encoder', value: result.cross_encoder_score, weight: '20%' },
                { label: 'Confidence', value: result.confidence_score, weight: '10%' },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-white/40">{item.label} <span className="text-white/15">({item.weight})</span></span>
                    <span className="font-mono font-bold text-white/70">{(item.value * 100).toFixed(1)}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/[0.04] overflow-hidden">
                    <div className={`h-full rounded-full bg-gradient-to-r ${barColor(item.value)} transition-all duration-700`} style={{ width: `${item.value * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <JsonViewer data={result} />
          </div>
        )}
        {error && <p className="text-xs text-red-400 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{error}</p>}
      </div>
    </SectionCard>
  );
}

/* ═══════════════════ 7. Raw API Tester ═══════════════════ */

function RawApiTester() {
  const [url, setUrl] = useState(`${ML_URL}/health`);
  const [method, setMethod] = useState('GET');
  const [body, setBody] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [latency, setLatency] = useState<number | null>(null);
  const [status, setStatus] = useState<number | null>(null);

  const send = async () => {
    setLoading(true); setError(''); setResult(null); setStatus(null);
    try {
      const opts: RequestInit = { method };
      if (method !== 'GET' && body.trim()) {
        opts.headers = { 'Content-Type': 'application/json' };
        opts.body = body;
      }
      const t0 = Date.now();
      const res = await fetch(url, opts);
      setLatency(Date.now() - t0);
      setStatus(res.status);
      const contentType = res.headers.get('content-type');
      if (contentType?.includes('json')) {
        setResult(await res.json());
      } else {
        setResult(await res.text());
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SectionCard icon={Terminal} title="Raw API Tester" gradient="from-gray-600 to-zinc-600">
      <div className="space-y-3">
        <div className="flex gap-2">
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className="rounded-lg border border-white/[0.06] bg-[#030303] px-2.5 py-2.5 text-xs text-white outline-none w-20"
          >
            {['GET', 'POST', 'PUT', 'DELETE'].map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="http://localhost:8000/health"
            className="flex-1 rounded-lg border border-white/[0.06] bg-[#030303] px-3 py-2.5 text-xs text-white placeholder:text-white/20 outline-none focus:border-white/[0.12] font-mono transition"
          />
        </div>
        {method !== 'GET' && (
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-widest text-white/30 mb-1.5 block">Request Body (JSON)</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder='{"key": "value"}'
              className="w-full rounded-lg border border-white/[0.06] bg-[#030303] px-3 py-2.5 text-xs text-white font-mono placeholder:text-white/20 outline-none focus:border-white/[0.12] min-h-[60px] resize-none transition"
            />
          </div>
        )}
        <button
          onClick={send}
          disabled={loading || !url.trim()}
          className="w-full rounded-lg bg-white/[0.08] border border-white/[0.08] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-white/[0.12] disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
          {loading ? 'Sending…' : 'Send Request'}
        </button>

        {(status !== null || latency !== null) && (
          <div className="flex items-center gap-3">
            {status !== null && (
              <span className={`font-mono text-xs font-bold ${status < 300 ? 'text-emerald-400' : status < 500 ? 'text-amber-400' : 'text-red-400'}`}>
                {status}
              </span>
            )}
            <LatencyBadge ms={latency} />
          </div>
        )}

        {result !== null && <JsonViewer data={result} maxH="max-h-96" />}
        {error && <p className="text-xs text-red-400 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{error}</p>}
      </div>
    </SectionCard>
  );
}

/* ═══════════════════ Quick Endpoints ═══════════════════ */

function QuickEndpoints() {
  const [results, setResults] = useState<Record<string, { data: any; latency: number; status: number } | null>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  const endpoints = [
    { label: 'ML Health', url: `${ML_URL}/health`, color: 'text-rose-400' },
    { label: 'Backend Health', url: `${BACKEND_URL}/health`, color: 'text-blue-400' },
    { label: 'Domains', url: `${BACKEND_URL}/api/sessions/domains`, color: 'text-violet-400' },
    { label: 'Modes', url: `${BACKEND_URL}/api/sessions/modes`, color: 'text-amber-400' },
  ];

  const hitEndpoint = async (url: string) => {
    setLoading((prev) => ({ ...prev, [url]: true }));
    try {
      const t0 = Date.now();
      const res = await fetch(url);
      const data = await res.json();
      setResults((prev) => ({ ...prev, [url]: { data, latency: Date.now() - t0, status: res.status } }));
    } catch (e: any) {
      setResults((prev) => ({ ...prev, [url]: { data: { error: e.message }, latency: 0, status: 0 } }));
    } finally {
      setLoading((prev) => ({ ...prev, [url]: false }));
    }
  };

  const hitAll = () => endpoints.forEach((ep) => hitEndpoint(ep.url));

  return (
    <SectionCard icon={Activity} title="Quick Endpoint Check" gradient="from-cyan-500 to-sky-500">
      <div className="space-y-3">
        <button
          onClick={hitAll}
          className="w-full rounded-lg bg-gradient-to-r from-cyan-500 to-sky-500 px-4 py-2.5 text-xs font-bold text-white transition hover:opacity-90 flex items-center justify-center gap-2"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Hit All Endpoints
        </button>

        <div className="space-y-2">
          {endpoints.map((ep) => (
            <div key={ep.url}>
              <button
                onClick={() => hitEndpoint(ep.url)}
                disabled={loading[ep.url]}
                className="w-full flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-xs hover:bg-white/[0.04] transition disabled:opacity-50"
              >
                <span className={`font-medium ${ep.color}`}>{ep.label}</span>
                <div className="flex items-center gap-2">
                  {loading[ep.url] && <Loader2 className="h-3 w-3 animate-spin text-white/30" />}
                  {results[ep.url] && (
                    <>
                      <span className={`font-mono text-[10px] ${results[ep.url]!.status < 300 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {results[ep.url]!.status}
                      </span>
                      <span className="font-mono text-[10px] text-white/30">{results[ep.url]!.latency}ms</span>
                    </>
                  )}
                </div>
              </button>
              {results[ep.url] && <JsonViewer data={results[ep.url]!.data} maxH="max-h-32" />}
            </div>
          ))}
        </div>
      </div>
    </SectionCard>
  );
}

/* ═══════════════════ Main Page ═══════════════════ */

export default function MLDebugPage() {
  const [mlHealth, setMlHealth] = useState<boolean | null>(null);
  const [backendHealth, setBackendHealth] = useState<boolean | null>(null);

  const checkHealth = useCallback(() => {
    setMlHealth(null);
    setBackendHealth(null);
    fetch(`${ML_URL}/health`)
      .then((r) => r.json().then((d) => setMlHealth(d.ready === true)))
      .catch(() => setMlHealth(false));
    fetch(`${BACKEND_URL}/health`)
      .then((r) => { if (r.ok) setBackendHealth(true); else setBackendHealth(false); })
      .catch(() => setBackendHealth(false));
  }, []);

  useEffect(() => { checkHealth(); }, [checkHealth]);

  return (
    <main className="min-h-screen bg-[#09090b]">
      {/* Header */}
      <div className="sticky top-0 z-50 border-b border-white/[0.04] bg-[#09090b]/80 backdrop-blur-2xl">
        <div className="max-w-[1440px] mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/20">
              <Terminal className="h-4 w-4 text-white" />
            </div>
            <div>
              <h1 className="text-base font-extrabold tracking-tight">ML Debug Console</h1>
              <p className="text-[10px] text-white/30">Test all ML pipeline services — no auth required</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <StatusPill ok={mlHealth} label="ML Service" />
            <StatusPill ok={backendHealth} label="Backend" />
            <button
              onClick={checkHealth}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.06] transition"
              title="Refresh health"
            >
              <RefreshCw className="h-3.5 w-3.5 text-white/40" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-[1440px] mx-auto px-6 py-8">
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          <FaceTester />
          <STTTester />
          <KeywordTester />
          <ResumeParserTester />
          <QuestionGenTester />
          <ScoringTester />
          <QuickEndpoints />
          <RawApiTester />
        </div>

        {/* Footer */}
        <div className="mt-10 text-center border-t border-white/[0.04] pt-6 pb-4">
          <div className="flex items-center justify-center gap-4 text-[10px] text-white/20">
            <span className="font-mono">ML: {ML_URL}</span>
            <span>•</span>
            <span className="font-mono">Backend: {BACKEND_URL}</span>
            <span>•</span>
            <span>All requests are made directly from the browser</span>
          </div>
        </div>
      </div>
    </main>
  );
}
