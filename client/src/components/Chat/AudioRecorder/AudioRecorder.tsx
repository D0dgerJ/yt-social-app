import React, { useEffect, useRef, useState } from 'react';
import './AudioRecorder.scss';

interface AudioRecorderProps {
  onCancel?: () => void;
  onSend: (file: File) => void;
  maxDurationSec?: number;    
}

const AudioRecorder: React.FC<AudioRecorderProps> = ({ onCancel, onSend, maxDurationSec = 300 }) => {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fmt = (s: number) => {
    const mm = Math.floor(s / 60).toString().padStart(2, '0');
    const ss = Math.floor(s % 60).toString().padStart(2, '0');
    return `${mm}:${ss}`;
  };

  useEffect(() => {
    return () => {
      stopAll();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startTimer = () => {
    if (timerRef.current) return;
    timerRef.current = window.setInterval(() => {
      setElapsed((e) => {
        const next = e + 1;
        if (next >= maxDurationSec) {
          stopRecording();
        }
        return next;
      });
    }, 1000);
  };

  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const requestStream = async () => {
    setError(null);
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: true });
      setStream(s);
      return s;
    } catch (e) {
      setError('Не удалось получить доступ к микрофону');
      throw e;
    }
  };

  const startRecording = async () => {
    if (isRecording) return;
    const s = stream || (await requestStream());

    const mimePrefer = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/ogg'
    ];
    let mimeType = '';
    for (const m of mimePrefer) {
      if (MediaRecorder.isTypeSupported(m)) {
        mimeType = m;
        break;
      }
    }

    const mr = new MediaRecorder(s!, mimeType ? { mimeType } : undefined);
    mediaRecorderRef.current = mr;
    chunksRef.current = [];
    setElapsed(0);
    setPreviewUrl(null);

    mr.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
    };

    mr.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mr.mimeType || 'audio/webm' });
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
      clearTimer();
      setIsRecording(false);
      setIsPaused(false);
    };

    mr.start(250);
    startTimer();
    setIsRecording(true);
    setIsPaused(false);
  };

  const pauseRecording = () => {
    const mr = mediaRecorderRef.current;
    if (!mr || mr.state !== 'recording') return;
    mr.pause();
    setIsPaused(true);
    clearTimer();
  };

  const resumeRecording = () => {
    const mr = mediaRecorderRef.current;
    if (!mr || mr.state !== 'paused') return;
    mr.resume();
    setIsPaused(false);
    startTimer();
  };

  const stopRecording = () => {
    const mr = mediaRecorderRef.current;
    if (!mr) return;
    if (mr.state !== 'inactive') {
      mr.stop();
    }
  };

  const stopAll = () => {
    stopRecording();
    stream?.getTracks().forEach((t) => t.stop());
    setStream(null);
    clearTimer();
  };

  const reset = () => {
    stopAll();
    setPreviewUrl(null);
    setElapsed(0);
    setIsRecording(false);
    setIsPaused(false);
    chunksRef.current = [];
  };

  const handleSend = () => {
    if (!previewUrl || chunksRef.current.length === 0) return;
    const mime = mediaRecorderRef.current?.mimeType || 'audio/webm';
    const ext = mime.includes('ogg') ? 'ogg' : 'webm';
    const blob = new Blob(chunksRef.current, { type: mime });
    const file = new File([blob], `voice-${Date.now()}.${ext}`, { type: mime });
    onSend(file);
    reset();
  };

  return (
    <div className="audio-recorder">
      <div className="audio-recorder__controls">
        {!isRecording && !previewUrl && (
          <button className="ar-btn ar-btn--start" onClick={startRecording} type="button">
            ● Запись
          </button>
        )}

        {isRecording && !isPaused && (
          <>
            <button className="ar-btn" onClick={pauseRecording} type="button">⏸ Пауза</button>
            <button className="ar-btn ar-btn--stop" onClick={stopRecording} type="button">■ Стоп</button>
          </>
        )}

        {isRecording && isPaused && (
          <>
            <button className="ar-btn" onClick={resumeRecording} type="button">▶ Продолжить</button>
            <button className="ar-btn ar-btn--stop" onClick={stopRecording} type="button">■ Завершить</button>
          </>
        )}

        {previewUrl && (
          <>
            <audio className="audio-recorder__player" src={previewUrl} controls />
            <button className="ar-btn ar-btn--send" onClick={handleSend} type="button">📤 Отправить</button>
            <button className="ar-btn" onClick={reset} type="button">↺ Перезаписать</button>
          </>
        )}

        <div className="audio-recorder__timer">{fmt(elapsed)}</div>
        {onCancel && <button className="ar-btn ar-btn--ghost" onClick={onCancel} type="button">✖</button>}
      </div>

      {error && <div className="audio-recorder__error">{error}</div>}
    </div>
  );
};

export default AudioRecorder;