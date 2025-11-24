import React, { useEffect, useState } from 'react';

interface AudioWaveformProps {
  audioUrl: string;
  progress?: number;
  barsCount?: number;
  height?: number;
}

const AudioWaveform: React.FC<AudioWaveformProps> = ({
  audioUrl,
  progress = 0,
  barsCount = 80,
  height = 40,
}) => {
  const [bars, setBars] = useState<number[]>([]);

  useEffect(() => {
    let cancelled = false;
    let audioContext: AudioContext | null = null;

    async function load() {
      try {
        if (typeof window === 'undefined') return;

        const AC =
          (window.AudioContext ||
            (window as any).webkitAudioContext) as
            | typeof AudioContext
            | undefined;

        if (!AC) return;

        audioContext = new AC();

        const resp = await fetch(audioUrl);
        const arrayBuffer = await resp.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

        const rawData = audioBuffer.getChannelData(0);
        const blockSize = Math.floor(rawData.length / barsCount);
        const samples: number[] = [];

        for (let i = 0; i < barsCount; i += 1) {
          const start = i * blockSize;
          const end = Math.min(start + blockSize, rawData.length);

          let sum = 0;
          for (let j = start; j < end; j += 1) {
            sum += Math.abs(rawData[j]);
          }

          samples.push(sum / (end - start || 1));
        }

        const max = Math.max(...samples) || 1;
        const normalized = samples.map((v) => v / max);

        if (!cancelled) {
          setBars(normalized);
        }
      } catch (e) {
        console.error('AudioWaveform error', e);
      }
    }

    load();

    return () => {
      cancelled = true;
      if (audioContext) {
        audioContext.close();
      }
    };
  }, [audioUrl, barsCount]);

  return (
    <div
      className="audio-waveform"
      style={{ height }}
    >
      {bars.length === 0 ? (
        <div className="audio-waveform__placeholder" />
      ) : (
        bars.map((amp, idx) => {
          const played = progress > 0 && idx / bars.length <= progress;
          const barHeight = 8 + amp * (height - 8);

          return (
            <div
              key={idx}
              className={
                played
                  ? 'audio-waveform__bar audio-waveform__bar--played'
                  : 'audio-waveform__bar'
              }
              style={{ height: `${barHeight}px` }}
            />
          );
        })
      )}
    </div>
  );
};

export default AudioWaveform;
