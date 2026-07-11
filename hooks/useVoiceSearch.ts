import { useState, useEffect, useRef } from 'react';

export interface UseVoiceSearchReturn {
  isListening: boolean;
  transcript: string;
  supported: boolean;
  error: string | null;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
}

export const useVoiceSearch = (onResult?: (text: string) => void): UseVoiceSearchReturn => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [supported, setSupported] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Check for window/webkit support
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      setSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'es-ES'; // Spanish support by default

      recognition.onstart = () => {
        setIsListening(true);
        setError(null);
      };

      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        const currentTranscript = finalTranscript || interimTranscript;
        setTranscript(currentTranscript);
        
        if (finalTranscript && onResult) {
          onResult(finalTranscript);
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Voice recognition error', event.error);
        if (event.error === 'not-allowed') {
          setError('Permiso de micrófono denegado');
        } else if (event.error === 'no-speech') {
          setError('No se detectó ninguna voz');
        } else {
          setError('Error al reconocer voz: ' + event.error);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } else {
      setSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const startListening = () => {
    if (!supported || !recognitionRef.current) {
      setError('Búsqueda por voz no soportada en este navegador');
      return;
    }

    try {
      setTranscript('');
      setError(null);
      recognitionRef.current.start();
    } catch (err) {
      console.error('Failed to start recognition', err);
      // If already started, ignore or stop first
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const resetTranscript = () => {
    setTranscript('');
    setError(null);
  };

  return {
    isListening,
    transcript,
    supported,
    error,
    startListening,
    stopListening,
    resetTranscript,
  };
};
