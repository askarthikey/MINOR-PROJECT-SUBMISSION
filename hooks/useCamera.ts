'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export type EmotionFrame = {
  emotion: string;
  confidence: number;
  timestamp: number;
};

type UseCameraReturn = {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  start: () => Promise<void>;
  stop: () => void;
  isActive: boolean;
  currentEmotion: string;
  emotionFrames: EmotionFrame[];
  resetFrames: () => void;
};

export function useCamera(mlServiceUrl: string): UseCameraReturn {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [isActive, setIsActive] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState('neutral');
  const [emotionFrames, setEmotionFrames] = useState<EmotionFrame[]>([]);

  const captureFrame = useCallback(async () => {
    if (!videoRef.current || !streamRef.current) return;

    try {
      const canvas = document.createElement('canvas');
      const video = videoRef.current;
      canvas.width = video.videoWidth || 320;
      canvas.height = video.videoHeight || 240;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/jpeg', 0.6)
      );
      if (!blob) return;

      const formData = new FormData();
      formData.append('frame', blob, 'frame.jpg');

      const response = await fetch(`${mlServiceUrl}/analyze_frame`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        const frame: EmotionFrame = {
          emotion: data.emotion || 'neutral',
          confidence: data.confidence || 0,
          timestamp: Date.now(),
        };
        setCurrentEmotion(frame.emotion);
        setEmotionFrames((prev) => [...prev, frame]);
      }
    } catch (err) {
      // Log frame capture errors for debugging
      console.warn('Emotion frame capture failed:', err);
    }
  }, [mlServiceUrl]);

  const start = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240, facingMode: 'user' },
      });
  streamRef.current = stream;
  if (videoRef.current) {
    videoRef.current.srcObject = stream;
    videoRef.current.play().catch(() => { });
  }
  setIsActive(true);

  // Capture frames every 2 seconds
  intervalRef.current = setInterval(captureFrame, 2000);
} catch {
  console.warn('Camera access denied or unavailable');
}
  }, [captureFrame]);

const stop = useCallback(() => {
  if (intervalRef.current) {
    clearInterval(intervalRef.current);
    intervalRef.current = null;
  }
  if (streamRef.current) {
    streamRef.current.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }
  if (videoRef.current) {
    videoRef.current.srcObject = null;
  }
  setIsActive(false);
}, []);

const resetFrames = useCallback(() => {
  setEmotionFrames([]);
  setCurrentEmotion('neutral');
}, []);

useEffect(() => {
  return () => {
    stop();
  };
}, [stop]);

return {
  videoRef,
  start,
  stop,
  isActive,
  currentEmotion,
  emotionFrames,
  resetFrames,
};
}
