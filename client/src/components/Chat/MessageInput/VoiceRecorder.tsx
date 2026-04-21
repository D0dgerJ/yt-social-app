import React, { useState } from 'react';
import AudioRecorder from '../AudioRecorder/AudioRecorder';

type Props = {
  disabled?: boolean;
  canAddMoreFiles?: boolean;
  onSend: (file: File) => Promise<void> | void;
};

export const VoiceRecorder: React.FC<Props> = ({
  disabled,
  canAddMoreFiles = true,
  onSend,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const handleOpen = () => {
    if (disabled || !canAddMoreFiles || isSending) return;
    setIsOpen(true);
  };

  const handleCancel = () => {
    if (isSending) return;
    setIsOpen(false);
  };

  const handleSend = async (file: File) => {
    try {
      setIsSending(true);
      await onSend(file);
      setIsOpen(false);
    } catch (e) {
      console.error('send voice failed', e);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="composer__voice">
      {!isOpen && (
        <button
          type="button"
          className="composer__voice-btn"
          onClick={handleOpen}
          disabled={disabled || !canAddMoreFiles}
          aria-label="Record voice message"
          title={
            !canAddMoreFiles
              ? 'Cannot add more attachments'
              : disabled
              ? 'Recording is currently unavailable'
              : 'Record voice message'
          }
        >
          🎤
        </button>
      )}

      {isOpen && (
        <div className="composer__voice-controls">
          <AudioRecorder
            maxDurationSec={300}
            onCancel={handleCancel}
            onSend={handleSend}
          />
        </div>
      )}
    </div>
  );
};
