import React, { useEffect, useRef, useState } from 'react';
import './AudioRecorder.scss';

interface AudioRecorderProps {
  onCancel?: () => void;
  onSend: (file: File) => void;
  maxDurationSec?: number;
}

const AudioRecorder: React.FC<AudioRecorderProps> = ({
  onCancel,
  onSend,
  maxDurationSec = 300,
}) => {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  type AudioUint8Array = Uint8Array<ArrayBuffer>;
  const dataArrayRef = useRef<AudioUint8Array | null>(null);

  const waveformRafRef = useRef<number | null>(null);

  const [bars, setBars] = useState<number[]>([]);

  const fmt = (s: number) => {
    const mm = Math.floor(s / 60)
      .toString()
      .padStart(2, '0');
    const ss = Math.floor(s % 60)
      .toString()
      .padStart(2, '0');
    return `${mm}:${ss}`;
  };

  useEffect(() => {
    return () => {
      stopAll();
    };
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

  const startWaveformLoop = () => {
    const analyser = analyserRef.current;
    const dataArray = dataArrayRef.current;
    if (!analyser || !dataArray) return;

    const barsCount = 80;

    const draw = () => {
      analyser.getByteTimeDomainData(
        dataArray as unknown as Uint8Array<ArrayBuffer>,
      );

      const step = Math.floor(dataArray.length / barsCount) || 1;
      const samples: number[] = [];

      for (let i = 0; i < barsCount; i += 1) {
        const start = i * step;
        const end = Math.min(start + step, dataArray.length);
        let sum = 0;
        for (let j = start; j < end; j += 1) {
          const v = dataArray[j];
          const centered = v - 128;
          sum += Math.abs(centered);
        }
        samples.push(sum / (end - start || 1));
      }

      const max = Math.max(...samples, 1);
      const normalized = samples.map((v) => v / max);

      setBars(normalized);
      waveformRafRef.current = window.requestAnimationFrame(draw);
    };

    if (waveformRafRef.current != null) {
      window.cancelAnimationFrame(waveformRafRef.current);
    }
    waveformRafRef.current = window.requestAnimationFrame(draw);
  };

  const stopWaveformLoop = () => {
    if (waveformRafRef.current != null) {
      window.cancelAnimationFrame(waveformRafRef.current);
      waveformRafRef.current = null;
    }
    setBars([]);
  };

  const cleanupAudioContext = () => {
    stopWaveformLoop();
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    dataArrayRef.current = null;
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

    try {
      const AC =
        (window.AudioContext ||
          (window as any).webkitAudioContext) as typeof AudioContext | undefined;

      if (AC) {
        const audioCtx = new AC();
        audioContextRef.current = audioCtx;

        const source = audioCtx.createMediaStreamSource(s);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 1024;

        const bufferLength = analyser.fftSize;
        const dataArray = new Uint8Array(bufferLength) as AudioUint8Array;

        analyserRef.current = analyser;
        dataArrayRef.current = dataArray;

        source.connect(analyser);
        startWaveformLoop();
      }
    } catch (e) {
      console.error('AudioContext init failed', e);
    }

    const mimePrefer = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/ogg',
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
      const blob = new Blob(chunksRef.current, {
        type: mr.mimeType || 'audio/webm',
      });
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
      clearTimer();
      setIsRecording(false);
      setIsPaused(false);
      cleanupAudioContext();
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
    cleanupAudioContext();
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
          <button
            className="ar-btn ar-btn--start"
            onClick={startRecording}
            type="button"
          >
            ● Запись
          </button>
        )}

        {isRecording && !isPaused && (
          <>
            <button className="ar-btn" onClick={pauseRecording} type="button">
              ⏸ Пауза
            </button>
            <button
              className="ar-btn ar-btn--stop"
              onClick={stopRecording}
              type="button"
            >
              ■ Стоп
            </button>
          </>
        )}

        {isRecording && isPaused && (
          <>
            <button className="ar-btn" onClick={resumeRecording} type="button">
              ▶ Продолжить
            </button>
            <button
              className="ar-btn ar-btn--stop"
              onClick={stopRecording}
              type="button"
            >
              ■ Завершить
            </button>
          </>
        )}

        {previewUrl && (
          <>
            <audio
              className="audio-recorder__player"
              src={previewUrl}
              controls
            />
            <button
              className="ar-btn ar-btn--send"
              onClick={handleSend}
              type="button"
            >
              📤 Отправить
            </button>
            <button className="ar-btn" onClick={reset} type="button">
              ↺ Перезаписать
            </button>
          </>
        )}

        <div className="audio-recorder__timer">{fmt(elapsed)}</div>
        {onCancel && (
          <button
            className="ar-btn ar-btn--ghost"
            onClick={onCancel}
            type="button"
          >
            ✖
          </button>
        )}
      </div>

      {/* 🔊 Живая волна во время записи */}
      {(isRecording || isPaused) && !previewUrl && (
        <div className="audio-recorder__wave">
          <div className="audio-waveform audio-waveform--live">
            {bars.length === 0 ? (
              <div className="audio-waveform__placeholder" />
            ) : (
              bars.map((amp, idx) => {
                const barHeight = 8 + amp * 32;
                return (
                  <div
                    key={idx}
                    className="audio-waveform__bar audio-waveform__bar--live"
                    style={{ height: `${barHeight}px` }}
                  />
                );
              })
            )}
          </div>
        </div>
      )}

      {error && <div className="audio-recorder__error">{error}</div>}
    </div>
  );
};

export default AudioRecorder;