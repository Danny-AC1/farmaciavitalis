// Service using Web Audio API for rich acoustic chime notifications
class NotificationAudioService {
    private audioCtx: AudioContext | null = null;
    private soundEnabled: boolean = true;
  
    private initContext() {
      if (!this.audioCtx && typeof window !== 'undefined') {
        const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioCtxClass) {
          this.audioCtx = new AudioCtxClass();
        }
      }
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
    }
  
    public setSoundEnabled(enabled: boolean) {
      this.soundEnabled = enabled;
    }
  
    public isSoundEnabled(): boolean {
      return this.soundEnabled;
    }
  
    // Play a crystal chime for new orders (Joyful 2-step pitch)
    public playOrderChime() {
      if (!this.soundEnabled) return;
      try {
        this.initContext();
        if (!this.audioCtx) return;
  
        const now = this.audioCtx.currentTime;
        
        // Tone 1
        const osc1 = this.audioCtx.createOscillator();
        const gain1 = this.audioCtx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(523.25, now); // C5
        osc1.frequency.exponentialRampToValueAtTime(659.25, now + 0.15); // E5
        gain1.gain.setValueAtTime(0.15, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
  
        osc1.connect(gain1);
        gain1.connect(this.audioCtx.destination);
        osc1.start(now);
        osc1.stop(now + 0.4);
  
        // Tone 2 (higher octave burst)
        const osc2 = this.audioCtx.createOscillator();
        const gain2 = this.audioCtx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(1046.50, now + 0.12); // C6
        gain2.gain.setValueAtTime(0.2, now + 0.12);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
  
        osc2.connect(gain2);
        gain2.connect(this.audioCtx.destination);
        osc2.start(now + 0.12);
        osc2.stop(now + 0.6);
      } catch {
        // Ignore audio autoplay restriction errors
      }
    }
  
    // Play a soft bubble ping for incoming live chat
    public playChatPing() {
      if (!this.soundEnabled) return;
      try {
        this.initContext();
        if (!this.audioCtx) return;
  
        const now = this.audioCtx.currentTime;
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
  
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now); // A5
        osc.frequency.exponentialRampToValueAtTime(1318.51, now + 0.1); // E6
        
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
  
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
  
        osc.start(now);
        osc.stop(now + 0.35);
      } catch {
        // Ignore
      }
    }
  
    // Play warning alert tone for low stock or urgent issues
    public playAlertTone() {
      if (!this.soundEnabled) return;
      try {
        this.initContext();
        if (!this.audioCtx) return;
  
        const now = this.audioCtx.currentTime;
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
  
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, now); // A4
        osc.frequency.setValueAtTime(349.23, now + 0.1); // F4
  
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
  
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
  
        osc.start(now);
        osc.stop(now + 0.35);
      } catch {
        // Ignore
      }
    }
  }
  
  export const notificationAudio = new NotificationAudioService();
  