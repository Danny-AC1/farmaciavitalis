import React, { useState, useRef, useEffect } from 'react';
import { Mic, Trash2, CheckCircle, Radio } from 'lucide-react';

interface VoiceRecorderProps {
  onSendVoice: (base64Audio: string, durationSec: number) => void;
  disabled?: boolean;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ onSendVoice, disabled }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [permissionError, setPermissionError] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      stopTimer();
    };
  }, []);

  const startTimer = () => {
    setDuration(0);
    timerRef.current = setInterval(() => {
      setDuration((prev) => prev + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const startRecording = async () => {
    setPermissionError(false);
    audioChunksRef.current = [];
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        // Stop all tracks to release the mic
        stream.getTracks().forEach(track => track.stop());

        if (audioChunksRef.current.length > 0) {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64data = reader.result as string;
            if (base64data) {
              onSendVoice(base64data, duration);
            }
          };
          reader.readAsDataURL(audioBlob);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      startTimer();
    } catch (err) {
      console.warn('Microphone permission denied or unavailable:', err);
      setPermissionError(true);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      stopTimer();
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      // Clear chunks and stop recording
      audioChunksRef.current = [];
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      stopTimer();
      setDuration(0);
    }
  };

  if (permissionError) {
    return (
      <span className="text-[10px] text-rose-500 font-bold px-2 py-1 bg-rose-50 rounded-lg">
        Micrófono inaccesible
      </span>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {isRecording ? (
        <div className="flex items-center gap-2.5 bg-rose-50 border border-rose-100 px-3 py-2 rounded-xl animate-pulse">
          <Radio size={14} className="text-rose-600 animate-spin" />
          <span className="text-[11px] font-black font-mono text-rose-600">
            {formatDuration(duration)}
          </span>
          <button
            type="button"
            onClick={cancelRecording}
            className="p-1 hover:bg-rose-100 text-rose-600 rounded-lg transition"
            title="Cancelar audio"
          >
            <Trash2 size={13} />
          </button>
          <button
            type="button"
            onClick={stopRecording}
            className="p-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition"
            title="Enviar audio"
          >
            <CheckCircle size={13} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          disabled={disabled}
          onClick={startRecording}
          className="p-3 bg-slate-50 hover:bg-rose-50 text-slate-500 hover:text-rose-600 border border-slate-200 hover:border-rose-200 rounded-xl transition flex items-center justify-center shrink-0"
          title="Grabar mensaje de voz"
        >
          <Mic size={15} />
        </button>
      )}
    </div>
  );
};
