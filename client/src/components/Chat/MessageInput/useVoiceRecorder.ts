import { useCallback, useMemo, useRef, useState } from 'react';

type RecState = 'idle' | 'recording';

function pickRecorderMime(): { mime: string; ext: string } | null {
  const list = [
    { mime: 'audio/webm;codecs=opus', ext: 'webm' },
    { mime: 'audio/ogg;codecs=opus',  ext: 'ogg'  },
    { mime: 'audio/webm',             ext: 'webm' },
    { mime: 'audio/ogg',              ext: 'ogg'  },
  ];
  if (!window.MediaRecorder) return null;
  for (const c of list) {
    if (MediaRecorder.isTypeSupported?.(c.mime)) return c;
  }
  return null;
}

export function useVoiceRecorder() {
  const support = useMemo(() => pickRecorderMime(), []);
  const [state, setState] = useState<RecState>('idle');
  const [durationMs, setDurationMs] = useState(0);

  const timerRef = useRef<number | undefined>();
  const streamRef = useRef<MediaStream | null>(null);
  const mrRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  const startTimer = useCallback(() => {
    setDurationMs(0);
    timerRef.current = window.setInterval(() => {
      setDurationMs((d) => d + 200);
    }, 200);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = undefined;
    }
  }, []);

  const start = useCallback(async () => {
    if (!support) throw new Error('MediaRecorder is not supported');
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    streamRef.current = stream;

    const mr = new MediaRecorder(stream, { mimeType: support.mime });
    chunksRef.current = [];

    mr.ondataavailable = (e: BlobEvent) => {
      if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
    };
    mr.onstop = () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };

    mr.start();
    mrRef.current = mr;
    setState('recording');
    startTimer();
  }, [startTimer, support]);

  const cancel = useCallback(() => {
    stopTimer();
    setState('idle');
    setDurationMs(0);
    chunksRef.current = [];
    if (mrRef.current && mrRef.current.state !== 'inactive') mrRef.current.stop();
    mrRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, [stopTimer]);

  const stopAndGetFile = useCallback(async () => {
    if (!mrRef.current) return null;

    stopTimer();
    const mr = mrRef.current;

    const stopped = new Promise<void>((resolve) => {
      mr.onstop = () => {
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        resolve();
      };
    });

    if (mr.state !== 'inactive') mr.stop();
    await stopped;

    const mime = mr.mimeType || (support?.mime ?? 'audio/webm');
    const ext  = support?.ext ?? 'webm';
    const blob = new Blob(chunksRef.current, { type: mime });
    chunksRef.current = [];

    setState('idle');
    setDurationMs(0);
    mrRef.current = null;

    const ts = Date.now();
    return new File([blob], `voice-${ts}.${ext}`, { type: mime });
  }, [stopTimer, support]);

  return {
    isSupported: !!support,
    isRecording: state === 'recording',
    durationMs,
    start,
    cancel,
    stopAndGetFile,
  };
}
