import React, { useMemo } from 'react';
import { useVoiceRecorder } from './useVoiceRecorder';

type Props = {
  disabled?: boolean;
  canAddMoreFiles?: boolean;
  onSend: (file: File) => Promise<void> | void;
};

export const VoiceRecorder: React.FC<Props> = ({ disabled, canAddMoreFiles = true, onSend }) => {
  const { isSupported, isRecording, durationMs, start, cancel, stopAndGetFile } = useVoiceRecorder();

  const mm = useMemo(() => String(Math.floor(durationMs / 1000 / 60)).padStart(2, '0'), [durationMs]);
  const ss = useMemo(() => String(Math.floor((durationMs / 1000) % 60)).padStart(2, '0'), [durationMs]);

  if (!isSupported) return null;

  const onStart = async () => {
    if (disabled || !canAddMoreFiles) return;
    try {
      await start();
    } catch (e) {
      console.error(e);
      alert('Не удалось получить доступ к микрофону.');
    }
  };

  const onStopAndSend = async () => {
    const f = await stopAndGetFile();
    if (!f) return;
    if (!canAddMoreFiles) {
      alert('Лимит вложений в сообщении достигнут.');
      return;
    }
    await onSend(f);
  };

  return (
    <div className="composer__voice">
      {!isRecording ? (
        <button
          type="button"
          className="composer__voice-btn"
          onClick={onStart}
          disabled={disabled}
          aria-label="Записать голосовое сообщение"
          title="Записать голосовое сообщение"
        >
          🎤
        </button>
      ) : (
        <div className="composer__voice-controls">
          <span className="composer__voice-dot" aria-hidden>●</span>
          <span className="composer__voice-timer">{mm}:{ss}</span>
          <button
            type="button"
            className="composer__voice-stop"
            onClick={onStopAndSend}
            aria-label="Остановить и отправить"
            title="Остановить и отправить"
          >
            ⏹
          </button>
          <button
            type="button"
            className="composer__voice-cancel"
            onClick={cancel}
            aria-label="Отменить запись"
            title="Отменить запись"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
};
