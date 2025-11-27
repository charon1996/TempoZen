import { LOOKAHEAD_MS, SCHEDULE_AHEAD_TIME_SEC } from '../constants';
import { SoundType } from '../types';

export class MetronomeAudio {
  private audioContext: AudioContext | null = null;
  private isPlaying: boolean = false;
  private current16thNote: number = 0;
  private nextNoteTime: number = 0.0;
  private timerID: number | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  
  // Configuration
  private bpm: number = 120;
  private beatsPerBar: number = 4;
  private soundType: SoundType = SoundType.DIGITAL;
  
  // Callback for UI visualization
  private onBeatCallback: ((beatIndex: number) => void) | null = null;

  constructor(onBeat: (beatIndex: number) => void) {
    this.onBeatCallback = onBeat;
  }

  public setBpm(bpm: number) {
    this.bpm = bpm;
  }

  public setBeatsPerBar(beats: number) {
    this.beatsPerBar = beats;
  }

  public setSoundType(type: SoundType) {
    this.soundType = type;
  }

  public start() {
    if (this.isPlaying) return;

    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.createNoiseBuffer();
    }

    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    this.isPlaying = true;
    this.current16thNote = 0;
    // Start slightly in the future to avoid immediate cut-off
    this.nextNoteTime = this.audioContext.currentTime + 0.1;
    this.scheduler();
  }

  public stop() {
    this.isPlaying = false;
    if (this.timerID) {
      window.clearTimeout(this.timerID);
    }
  }

  private createNoiseBuffer() {
    if (!this.audioContext) return;
    const bufferSize = this.audioContext.sampleRate * 2.0; // 2 seconds of noise
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    this.noiseBuffer = buffer;
  }

  private scheduler = () => {
    // While there are notes that will need to play before the next interval, 
    // schedule them and advance the pointer.
    if (!this.audioContext) return;

    while (this.nextNoteTime < this.audioContext.currentTime + SCHEDULE_AHEAD_TIME_SEC) {
      this.scheduleNote(this.current16thNote, this.nextNoteTime);
      this.nextNote();
    }
    
    if (this.isPlaying) {
      this.timerID = window.setTimeout(this.scheduler, LOOKAHEAD_MS);
    }
  };

  private nextNote() {
    // Advance current note and time by a 16th note...
    const secondsPerBeat = 60.0 / this.bpm;
    this.nextNoteTime += secondsPerBeat; 

    this.current16thNote++;
    if (this.current16thNote >= this.beatsPerBar) {
      this.current16thNote = 0;
    }
  }

  private scheduleNote(beatNumber: number, time: number) {
    if (!this.audioContext) return;

    const isAccent = beatNumber === 0;

    // Trigger Sound based on type
    switch (this.soundType) {
      case SoundType.DRUM:
        this.playDrumSound(isAccent, time);
        break;
      case SoundType.ANALOG:
        this.playAnalogSound(isAccent, time);
        break;
      case SoundType.WOODBLOCK:
        this.playWoodblockSound(isAccent, time);
        break;
      case SoundType.DIGITAL:
      default:
        this.playDigitalSound(isAccent, time);
        break;
    }

    // Schedule the visual callback
    const delay = (time - this.audioContext.currentTime) * 1000;
    const safeDelay = Math.max(0, delay);
    
    setTimeout(() => {
      if (this.isPlaying && this.onBeatCallback) {
        this.onBeatCallback(beatNumber);
      }
    }, safeDelay);
  }

  // --- Sound Generators ---

  private playDigitalSound(isAccent: boolean, time: number) {
    if (!this.audioContext) return;
    const osc = this.audioContext.createOscillator();
    const envelope = this.audioContext.createGain();

    osc.connect(envelope);
    envelope.connect(this.audioContext.destination);

    osc.frequency.value = isAccent ? 1000 : 800;
    envelope.gain.value = 1;
    envelope.gain.exponentialRampToValueAtTime(1, time + 0.001);
    envelope.gain.exponentialRampToValueAtTime(0.001, time + 0.05);

    osc.start(time);
    osc.stop(time + 0.05);
  }

  private playAnalogSound(isAccent: boolean, time: number) {
    if (!this.audioContext) return;
    const osc = this.audioContext.createOscillator();
    const envelope = this.audioContext.createGain();

    osc.type = 'triangle';
    osc.connect(envelope);
    envelope.connect(this.audioContext.destination);

    osc.frequency.setValueAtTime(isAccent ? 880 : 440, time);
    // Slight pitch drop for analog feel
    osc.frequency.exponentialRampToValueAtTime(isAccent ? 440 : 220, time + 0.05);

    envelope.gain.setValueAtTime(0, time);
    envelope.gain.linearRampToValueAtTime(0.8, time + 0.005);
    envelope.gain.exponentialRampToValueAtTime(0.001, time + 0.05);

    osc.start(time);
    osc.stop(time + 0.05);
  }

  private playDrumSound(isAccent: boolean, time: number) {
    if (!this.audioContext) return;

    if (isAccent) {
        // Kick Drum
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        osc.connect(gain);
        gain.connect(this.audioContext.destination);

        osc.frequency.setValueAtTime(150, time);
        osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.5);

        gain.gain.setValueAtTime(1, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.5);

        osc.start(time);
        osc.stop(time + 0.5);
    } else {
        // Hi-hat / Shaker
        const bufferSource = this.audioContext.createBufferSource();
        bufferSource.buffer = this.noiseBuffer;
        
        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 8000;

        const gain = this.audioContext.createGain();
        
        bufferSource.connect(filter);
        filter.connect(gain);
        gain.connect(this.audioContext.destination);

        gain.gain.setValueAtTime(0.4, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);

        bufferSource.start(time);
        bufferSource.stop(time + 0.05);
    }
  }

  private playWoodblockSound(isAccent: boolean, time: number) {
    if (!this.audioContext) return;
    const osc = this.audioContext.createOscillator();
    const envelope = this.audioContext.createGain();

    // Woodblock is typically a sine wave with very short decay
    osc.type = 'sine';
    osc.connect(envelope);
    envelope.connect(this.audioContext.destination);

    // High pitch for woodblock
    osc.frequency.value = isAccent ? 1200 : 800;

    envelope.gain.setValueAtTime(0, time);
    envelope.gain.linearRampToValueAtTime(0.8, time + 0.005);
    envelope.gain.exponentialRampToValueAtTime(0.001, time + 0.1);

    osc.start(time);
    osc.stop(time + 0.1);
  }
}