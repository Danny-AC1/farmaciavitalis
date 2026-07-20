import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2 } from 'lucide-react';

interface AudioPlayerProps {
  src: string;
  isMe?: boolean;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ src, isMe }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Reset state on source change
    setIsPlaying(false);
    setCurrentTime(0);
  }, [src]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(err => console.warn("Audio playback failed:", err));
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    setCurrentTime(audioRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (!audioRef.current) return;
    setDuration(audioRef.current.duration || 0);
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current) return;
    const value = parseFloat(e.target.value);
    audioRef.current.currentTime = value;
    setCurrentTime(value);
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className={`flex items-center gap-3 p-2.5 rounded-2xl min-w-[200px] sm:min-w-[240px] border ${
      isMe 
        ? 'bg-teal-700/40 border-teal-500/20 text-teal-100' 
        : 'bg-slate-100 border-slate-200 text-slate-800'
    }`}>
      <audio 
        ref={audioRef}
        src={src}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleAudioEnded}
        preload="metadata"
      />

      <button
        type="button"
        onClick={togglePlay}
        className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 transition-transform hover:scale-105 active:scale-95 ${
          isMe 
            ? 'bg-white text-teal-700 shadow-md shadow-teal-900/10' 
            : 'bg-teal-600 text-white shadow-md shadow-teal-600/10'
        }`}
      >
        {isPlaying ? <Pause size={13} fill="currentColor" /> : <Play size={13} className="ml-0.5" fill="currentColor" />}
      </button>

      <div className="flex-grow space-y-1 min-w-0">
        <input 
          type="range"
          min="0"
          max={duration || 100}
          value={currentTime}
          onChange={handleScrub}
          className={`w-full h-1 rounded-lg appearance-none cursor-pointer focus:outline-none ${
            isMe ? 'accent-teal-300 bg-teal-800/80' : 'accent-teal-600 bg-slate-200'
          }`}
          style={{ backgroundSize: `${(currentTime / (duration || 100)) * 100}% 100%` }}
        />
        <div className="flex justify-between items-center text-[9px] font-bold opacity-80 select-none">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      <Volume2 size={12} className="opacity-60 shrink-0" />
    </div>
  );
};
