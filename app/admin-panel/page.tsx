'use client';

import {
  Activity,
  AlertCircle,
  BookOpen,
  Brain,
  Camera,
  CheckCircle2,
  ChevronDown,
  Clock,
  FileText,
  Loader2,
  Mic,
  MicOff,
  Search,
  Server,
  Sparkles,
  Target,
  Upload,
  X,
  Zap,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { Header } from '@/components/Header';
import { ML_URL } from '@/lib/api-client';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';

/* ─────────────────────────── helpers ─────────────────────────── */

function Timer({ startTime }: { startTime: number | null }) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!startTime) return;
    const interval = setInterval(() => setElapsed(Date.now() - startTime), 50);
    return () => clearInterval(interval);
  }, [startTime]);
  if (!startTime) return null;
  return (
    <span className="font-mono text-[11px] text-muted-foreground">
      {(elapsed / 1000).toFixed(2)}s
    </span>
  );
}

function JsonViewer({ data }: { data: any }) {
  if (data === null || data === undefined) return null;
  return (
    <pre className="mt-3 max-h-72 overflow-auto rounded-lg border border-border/30 bg-[#0d0d0d] p-3 text-[11px] leading-relaxed text-green-400 font-mono scrollbar-thin">
      {typeof data === 'string' ? data : JSON.stringify(data, null, 2)}
    </pre>
  );
}

function StatusDot({ ok }: { ok: boolean | null }) {
  if (ok === null) return <div className="h-2.5 w-2.5 rounded-full bg-gray-500 animate-pulse" />;
  return ok ? (
    <div className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)]" />
  ) : (
    <div className="h-2.5 w-2.5 rounded-full bg-red-400 shadow-[0_0_6px_rgba(248,113,113,0.5)]" />
  );
}

function CardShell({
  icon: Icon,
  title,
  color,
  children,
}: {
  icon: any;
  title: string;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <div className="group bg-card/50 border-border/30 hover:border-border/50 rounded-2xl border p-5 transition-all duration-300 hover:shadow-lg hover:shadow-black/10">
      <div className="flex items-center gap-2.5 mb-4">
        <div className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${color}`}>
          <Icon className="h-4.5 w-4.5 text-white" />
        </div>
        <h3 className="text-sm font-bold">{title}</h3>
      </div>
      {children}
    </div>
  );
}

/* ─────────────────── 1. Face Confidence Tester ─────────────────── */

function FaceTester() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [startTime, setStartTime] = useState<number | null>(null);
  const [latency, setLatency] = useState<number | null>(null);
  const [useWebcam, setUseWebcam] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    setLoading(true);
    setError('');
    setResult(null);
    setStartTime(Date.now());

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
      setStartTime(null);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setError('');
    setResult(null);
    setStartTime(Date.now());

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
      setStartTime(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <CardShell icon={Camera} title="Face Confidence Scorer" color="from-pink-500 to-rose-600">
      <div className="space-y-3">
        <div className="flex gap-2">
          <button
            onClick={() => setUseWebcam(true)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${useWebcam ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-card/80 text-muted-foreground border border-border/30'}`}
          >
            <Camera className="inline h-3 w-3 mr-1" />
            Webcam
          </button>
          <button
            onClick={() => setUseWebcam(false)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${!useWebcam ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-card/80 text-muted-foreground border border-border/30'}`}
          >
            <Upload className="inline h-3 w-3 mr-1" />
            File
          </button>
        </div>

        {useWebcam && (
          <div className="relative rounded-lg overflow-hidden border border-border/30 bg-black aspect-video">
            <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
            <canvas ref={canvasRef} className="hidden" />
          </div>
        )}

        {useWebcam ? (
          <button
            onClick={captureAndAnalyze}
            disabled={loading}
            className="w-full rounded-lg bg-gradient-to-r from-pink-500 to-rose-600 px-4 py-2 text-xs font-bold text-white transition hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
            {loading ? 'Analyzing…' : 'Capture & Analyze'}
          </button>
        ) : (
          <>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              className="w-full rounded-lg bg-gradient-to-r from-pink-500 to-rose-600 px-4 py-2 text-xs font-bold text-white transition hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
              {loading ? 'Analyzing…' : 'Upload Image'}
            </button>
          </>
        )}

        {latency !== null && (
          <p className="text-[10px] text-muted-foreground">Latency: {latency}ms</p>
        )}

        {result && (
          <div>
            <div className="flex items-center gap-3 rounded-lg bg-primary/5 border border-primary/20 p-3">
              <div className="text-center">
                <p className="text-2xl font-black text-primary">{result.emotion}</p>
                <p className="text-[10px] text-muted-foreground">{(result.confidence * 100).toFixed(1)}% confident</p>
              </div>
            </div>
            {result.all_emotions && (
              <div className="mt-2 space-y-1">
                {Object.entries(result.all_emotions)
                  .sort(([, a], [, b]) => (b as number) - (a as number))
                  .map(([label, score]) => (
                    <div key={label} className="flex items-center gap-2 text-[11px]">
                      <span className="w-16 text-muted-foreground capitalize">{label}</span>
                      <div className="h-1.5 flex-1 rounded-full bg-border/30 overflow-hidden">
                        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(score as number) * 100}%` }} />
                      </div>
                      <span className="font-mono w-10 text-right">{((score as number) * 100).toFixed(1)}%</span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {error && <p className="text-xs text-red-400 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{error}</p>}
        {loading && <Timer startTime={startTime} />}
      </div>
    </CardShell>
  );
}

/* ─────────────────── 2. Speech-to-Text Tester ─────────────────── */

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
    // Expose restart flag on recognition for toggle
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
    <CardShell icon={Mic} title="Speech-to-Text" color="from-blue-500 to-cyan-600">
      <div className="space-y-3">
        {!supported ? (
          <p className="text-xs text-red-400">Browser does not support SpeechRecognition API</p>
        ) : (
          <>
            <button
              onClick={toggle}
              className={`w-full rounded-lg px-4 py-2.5 text-xs font-bold text-white transition flex items-center justify-center gap-2 ${
                isListening
                  ? 'bg-red-500/80 hover:bg-red-500'
                  : 'bg-gradient-to-r from-blue-500 to-cyan-600 hover:opacity-90'
              }`}
            >
              {isListening ? (
                <>
                  <MicOff className="h-3.5 w-3.5" /> Stop Listening
                </>
              ) : (
                <>
                  <Mic className="h-3.5 w-3.5" /> Start Listening
                </>
              )}
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

            <div className="min-h-[80px] rounded-lg border border-border/30 bg-[#0d0d0d] p-3 text-xs leading-relaxed">
              {transcript && <span className="text-foreground">{transcript}</span>}
              {interim && <span className="text-muted-foreground/60 italic">{interim}</span>}
              {!transcript && !interim && (
                <span className="text-muted-foreground/40 italic">Transcript will appear here…</span>
              )}
            </div>

            <button
              onClick={() => { setTranscript(''); setInterim(''); }}
              className="text-[10px] text-muted-foreground hover:text-foreground underline transition"
            >
              Clear
            </button>
          </>
        )}
      </div>
    </CardShell>
  );
}

/* ─────────────────── 3. Keyword Matching Tester ─────────────────── */

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
      matched: matched,
      unmatched: unmatched,
      coverage: coverage,
      coverage_pct: `${(coverage * 100).toFixed(1)}%`,
    });
  };

  return (
    <CardShell icon={Search} title="Keyword Matching" color="from-amber-500 to-orange-600">
      <div className="space-y-3">
        <div>
          <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1 block">User Answer</label>
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Enter the user's answer text..."
            className="w-full rounded-lg border border-border/40 bg-[#0d0d0d] px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/40 outline-none focus:border-primary/50 min-h-[60px] resize-none"
          />
        </div>
        <div>
          <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1 block">Keywords (comma-separated)</label>
          <input
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            placeholder="e.g. gradient descent, loss function, backpropagation"
            className="w-full rounded-lg border border-border/40 bg-[#0d0d0d] px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/40 outline-none focus:border-primary/50"
          />
        </div>
        <button
          onClick={analyze}
          disabled={!answer.trim() || !keywords.trim()}
          className="w-full rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 px-4 py-2 text-xs font-bold text-white transition hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <Target className="h-3.5 w-3.5" />
          Check Coverage
        </button>
        {result && (
          <div>
            <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 text-center mb-2">
              <p className="text-3xl font-black text-primary">{result.coverage_pct}</p>
              <p className="text-[10px] text-muted-foreground">{result.matched.length}/{result.total_keywords} keywords matched</p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {result.matched.map((kw: string) => (
                <span key={kw} className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                  <CheckCircle2 className="h-2.5 w-2.5" />{kw}
                </span>
              ))}
              {result.unmatched.map((kw: string) => (
                <span key={kw} className="inline-flex items-center gap-1 rounded-full bg-red-500/20 border border-red-500/30 px-2 py-0.5 text-[10px] font-medium text-red-400">
                  <X className="h-2.5 w-2.5" />{kw}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </CardShell>
  );
}

/* ─────────────────── 4. Resume Parser Tester ─────────────────── */

function ResumeParserTester() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [latency, setLatency] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setError('');
    setResult(null);

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
    <CardShell icon={FileText} title="Resume Parser" color="from-emerald-500 to-teal-600">
      <div className="space-y-3">
        <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={handleUpload} />
        <button
          onClick={() => fileRef.current?.click()}
          disabled={loading}
          className="w-full rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-2 text-xs font-bold text-white transition hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
          {loading ? 'Parsing…' : 'Upload Resume PDF'}
        </button>

        {latency !== null && <p className="text-[10px] text-muted-foreground">Parsed in {latency}ms</p>}

        {result && (
          <div className="space-y-2">
            {result.basic_info && (
              <div className="rounded-lg border border-border/30 bg-primary/5 p-3">
                <p className="text-xs font-bold mb-1">Basic Info</p>
                <div className="text-[11px] text-muted-foreground space-y-0.5">
                  {result.basic_info.name && <p>Name: <span className="text-foreground">{result.basic_info.name}</span></p>}
                  {result.basic_info.email && <p>Email: <span className="text-foreground">{result.basic_info.email}</span></p>}
                  {result.basic_info.phone && <p>Phone: <span className="text-foreground">{result.basic_info.phone}</span></p>}
                </div>
              </div>
            )}
            {result.skills?.length > 0 && (
              <div>
                <p className="text-xs font-bold mb-1">Skills ({result.skills.length})</p>
                <div className="flex flex-wrap gap-1">
                  {result.skills.map((s: string) => (
                    <span key={s} className="rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-[10px] text-primary font-medium">{s}</span>
                  ))}
                </div>
              </div>
            )}
            <JsonViewer data={result} />
          </div>
        )}

        {error && <p className="text-xs text-red-400 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{error}</p>}
      </div>
    </CardShell>
  );
}

/* ─────────────────── 5. Question Generator Tester ─────────────────── */

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
    setLoading(true);
    setError('');
    setResult(null);

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
    <CardShell icon={Sparkles} title="Question Generator" color="from-violet-500 to-purple-600">
      <div className="space-y-3">
        <div>
          <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1 block">Domain</label>
          <select
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            className="w-full rounded-lg border border-border/40 bg-[#0d0d0d] px-3 py-2 text-xs text-foreground outline-none focus:border-primary/50"
          >
            {DOMAINS.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1 block">Topic (optional)</label>
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. Neural Networks, Sorting, TCP/IP..."
            className="w-full rounded-lg border border-border/40 bg-[#0d0d0d] px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/40 outline-none focus:border-primary/50"
          />
        </div>
        <div>
          <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1 block">Difficulty</label>
          <div className="flex gap-2">
            {['easy', 'medium', 'hard'].map((d) => (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                className={`flex-1 rounded-lg py-1.5 text-xs font-medium capitalize transition border ${
                  difficulty === d
                    ? 'bg-primary/20 text-primary border-primary/30'
                    : 'bg-card/80 text-muted-foreground border-border/30 hover:border-border/50'
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
          className="w-full rounded-lg bg-gradient-to-r from-violet-500 to-purple-600 px-4 py-2 text-xs font-bold text-white transition hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
          {loading ? 'Generating…' : 'Generate Question'}
        </button>

        {latency !== null && <p className="text-[10px] text-muted-foreground">Generated in {latency}ms</p>}

        {result && (
          <div className="space-y-2">
            {(result.question_text || result.question) && (
              <div className="rounded-lg border border-border/30 bg-primary/5 p-3">
                <p className="text-xs font-bold mb-1">Question</p>
                <p className="text-[11px] text-foreground leading-relaxed">{result.question_text || result.question}</p>
              </div>
            )}
            {result.expected_answer && (
              <div className="rounded-lg border border-border/30 bg-card/50 p-3">
                <p className="text-xs font-bold mb-1">Expected Answer</p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">{result.expected_answer}</p>
              </div>
            )}
            {result.keywords?.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {result.keywords.map((kw: string) => (
                  <span key={kw} className="rounded-full bg-violet-500/20 border border-violet-500/30 px-2 py-0.5 text-[10px] text-violet-400 font-medium">{kw}</span>
                ))}
              </div>
            )}
            <JsonViewer data={result} />
          </div>
        )}

        {error && <p className="text-xs text-red-400 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{error}</p>}
      </div>
    </CardShell>
  );
}

/* ─────────────────── 6. Scoring Pipeline Tester ─────────────────── */

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
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const kws = keywords.split(',').map((k) => k.trim()).filter(Boolean);
      let emotion_timeline: any[] = [];
      if (emotionStr.trim()) {
        try { emotion_timeline = JSON.parse(emotionStr); } catch {
          // Fallback: treat as comma-separated "emotion:confidence" pairs
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
        body: JSON.stringify({
          user_answer: userAnswer,
          expected_answer: expectedAnswer,
          keywords: kws,
          emotion_timeline,
        }),
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

  const scoreBarColor = (value: number) => {
    if (value >= 0.7) return 'bg-emerald-400';
    if (value >= 0.4) return 'bg-amber-400';
    return 'bg-red-400';
  };

  return (
    <CardShell icon={Brain} title="Scoring Pipeline" color="from-indigo-500 to-blue-600">
      <div className="space-y-3">
        <div>
          <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1 block">User Answer</label>
          <textarea
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            placeholder="The user's spoken answer..."
            className="w-full rounded-lg border border-border/40 bg-[#0d0d0d] px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/40 outline-none focus:border-primary/50 min-h-[60px] resize-none"
          />
        </div>
        <div>
          <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1 block">Expected Answer</label>
          <textarea
            value={expectedAnswer}
            onChange={(e) => setExpectedAnswer(e.target.value)}
            placeholder="The model/expected answer..."
            className="w-full rounded-lg border border-border/40 bg-[#0d0d0d] px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/40 outline-none focus:border-primary/50 min-h-[60px] resize-none"
          />
        </div>
        <div>
          <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1 block">Keywords (comma-separated)</label>
          <input
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            placeholder="gradient, loss, backprop"
            className="w-full rounded-lg border border-border/40 bg-[#0d0d0d] px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/40 outline-none focus:border-primary/50"
          />
        </div>
        <div>
          <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1 block">
            Emotion Timeline <span className="text-muted-foreground/50">(optional — e.g. happy:0.8, neutral:0.5)</span>
          </label>
          <input
            value={emotionStr}
            onChange={(e) => setEmotionStr(e.target.value)}
            placeholder="happy:0.8, neutral:0.6, happy:0.9"
            className="w-full rounded-lg border border-border/40 bg-[#0d0d0d] px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/40 outline-none focus:border-primary/50"
          />
        </div>

        <button
          onClick={score}
          disabled={loading || !userAnswer.trim() || !expectedAnswer.trim()}
          className="w-full rounded-lg bg-gradient-to-r from-indigo-500 to-blue-600 px-4 py-2 text-xs font-bold text-white transition hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
          {loading ? 'Scoring…' : 'Score Answer'}
        </button>

        {latency !== null && <p className="text-[10px] text-muted-foreground">Scored in {latency}ms</p>}

        {result && (
          <div className="space-y-2">
            {/* Composite Score — big display */}
            <div className="rounded-xl bg-gradient-to-r from-indigo-500/10 to-blue-500/10 border border-indigo-500/20 p-4 text-center">
              <p className="text-4xl font-black text-primary">{(result.composite * 100).toFixed(1)}%</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Composite Score</p>
              {result.dominant_emotion && (
                <p className="text-[10px] text-muted-foreground">Dominant Emotion: <span className="text-foreground font-medium capitalize">{result.dominant_emotion}</span></p>
              )}
            </div>

            {/* Score breakdown bars */}
            <div className="space-y-2">
              {[
                { label: 'Semantic Similarity', value: result.semantic_similarity, weight: '40%' },
                { label: 'Keyword Coverage', value: result.keyword_coverage, weight: '30%' },
                { label: 'Cross-Encoder', value: result.cross_encoder_score, weight: '20%' },
                { label: 'Confidence', value: result.confidence_score, weight: '10%' },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex justify-between text-[11px] mb-0.5">
                    <span className="text-muted-foreground">{item.label} <span className="text-muted-foreground/50">({item.weight})</span></span>
                    <span className="font-mono font-bold">{(item.value * 100).toFixed(1)}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-border/30 overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-500 ${scoreBarColor(item.value)}`} style={{ width: `${item.value * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>

            <JsonViewer data={result} />
          </div>
        )}

        {error && <p className="text-xs text-red-400 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{error}</p>}
      </div>
    </CardShell>
  );
}

/* ═══════════════════════ Main Admin Panel ═══════════════════════ */

export default function AdminPanelPage() {
  const [mlHealth, setMlHealth] = useState<boolean | null>(null);
  const [backendHealth, setBackendHealth] = useState<boolean | null>(null);

  useEffect(() => {
    // Check ML service health
    fetch(`${ML_URL}/health`)
      .then((r) => r.json().then((d) => setMlHealth(d.ready === true)))
      .catch(() => setMlHealth(false));

    // Check backend health
    fetch(`${BACKEND_URL}/health`)
      .then((r) => { if (r.ok) setBackendHealth(true); else setBackendHealth(false); })
      .catch(() => setBackendHealth(false));
  }, []);

  return (
    <>
      <Header />
      <main className="bg-background min-h-[calc(100vh-3.5rem)]">
        <div className="w-full px-6 py-8 lg:px-10">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-extrabold flex items-center gap-2">
                <Server className="h-6 w-6 text-primary" />
                ML Services Dashboard
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                Test and debug all ML pipeline services in one place
              </p>
            </div>

            {/* Health indicators */}
            <div className="flex gap-4">
              <div className="flex items-center gap-2 rounded-xl border border-border/30 bg-card/60 px-4 py-2.5">
                <StatusDot ok={mlHealth} />
                <div>
                  <p className="text-[10px] text-muted-foreground">ML Service</p>
                  <p className="text-xs font-bold">
                    {mlHealth === null ? 'Checking…' : mlHealth ? 'Online' : 'Offline'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-border/30 bg-card/60 px-4 py-2.5">
                <StatusDot ok={backendHealth} />
                <div>
                  <p className="text-[10px] text-muted-foreground">Backend</p>
                  <p className="text-xs font-bold">
                    {backendHealth === null ? 'Checking…' : backendHealth ? 'Online' : 'Offline'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Grid of testers */}
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            <FaceTester />
            <STTTester />
            <KeywordTester />
            <ResumeParserTester />
            <QuestionGenTester />
            <ScoringTester />
          </div>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-[10px] text-muted-foreground">
              ML: {ML_URL} &nbsp;•&nbsp; Backend: {BACKEND_URL} &nbsp;•&nbsp; All requests are made directly from the browser
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
