'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type UseSTTReturn = {
  transcript: string;
  interimTranscript: string;
  isListening: boolean;
  isSupported: boolean;
  start: () => void;
  stop: () => string;
  reset: () => void;
};

export function useSTT(): UseSTTReturn {
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  const recognitionRef = useRef<any>(null);
  const transcriptRef = useRef('');
  const shouldRestartRef = useRef(false);
  // Track how many final results we've already consumed so we never
  // re-append previously finalized text after an auto-restart.
  const processedIndexRef = useRef(0);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setIsSupported(Boolean(SpeechRecognition));

    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      let interim = '';

      // Only process results starting from the index we haven't seen yet.
      // event.resultIndex tells us the first result that changed, but we
      // also keep our own counter to handle the auto-restart edge case
      // where event.resultIndex resets to 0.
      const startIdx = Math.max(event.resultIndex, processedIndexRef.current);

      for (let i = startIdx; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          transcriptRef.current += result[0].transcript + ' ';
          setTranscript(transcriptRef.current);
          // Mark this index as consumed so we skip it on future events
          processedIndexRef.current = i + 1;
        } else {
          interim += result[0].transcript;
        }
      }
      setInterimTranscript(interim);
    };

    recognition.onend = () => {
      // Auto-restart if still supposed to be listening
      if (shouldRestartRef.current) {
        // Reset the processed index counter — a new recognition session
        // starts result indices from 0 again.
        processedIndexRef.current = 0;
        try {
          recognition.start();
        } catch {
          setIsListening(false);
          shouldRestartRef.current = false;
        }
      } else {
        setIsListening(false);
      }
    };

    recognition.onerror = (event: any) => {
      if (event.error === 'no-speech' || event.error === 'aborted') return;
      console.warn('STT error:', event.error);
    };

    recognitionRef.current = recognition;

    return () => {
      shouldRestartRef.current = false;
      try {
        recognition.stop();
      } catch {}
    };
  }, []);

  const start = useCallback(() => {
    if (!recognitionRef.current) return;
    shouldRestartRef.current = true;
    processedIndexRef.current = 0;
    try {
      recognitionRef.current.start();
      setIsListening(true);
    } catch {
      // Already started
    }
  }, []);

  const stop = useCallback((): string => {
    shouldRestartRef.current = false;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    setIsListening(false);
    setInterimTranscript('');
    return transcriptRef.current;
  }, []);

  const reset = useCallback(() => {
    transcriptRef.current = '';
    processedIndexRef.current = 0;
    setTranscript('');
    setInterimTranscript('');
  }, []);

  return {
    transcript,
    interimTranscript,
    isListening,
    isSupported,
    start,
    stop,
    reset,
  };
}
