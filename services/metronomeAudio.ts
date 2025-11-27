import { LOOKAHEAD_MS, SCHEDULE_AHEAD_TIME_SEC } from '../constants';

export class MetronomeAudio {
  private audioContext: AudioContext | null = null;
  private isPlaying: boolean = false;
  private current16thNote: number = 0;
  private nextNoteTime: number = 0.0;
  private timerID: number | null = null;
  
  // Configuration
  private bpm: number = 120;
  private beatsPerBar: number = 4;
  
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

  public start() {
    if (this.isPlaying) return;

    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
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
    // Notice this picks up the CURRENT bpm value to calculate beat length.
    const secondsPerBeat = 60.0 / this.bpm;
    // We are only supporting quarter notes for the main beat right now for simplicity 
    // (treating "16thNote" variable as actually just "Beat" variable for now for cleaner code if no subdivisions)
    // However, for expandability, let's treat it as a quarter note engine mainly.
    // If we want actual 16th notes, we'd divide by 0.25 * secondsPerBeat.
    // Requirement says "Fixed beat levels", so let's stick to Quarter notes as the main driver.
    
    this.nextNoteTime += secondsPerBeat; 

    this.current16thNote++;
    if (this.current16thNote >= this.beatsPerBar) {
      this.current16thNote = 0;
    }
  }

  private scheduleNote(beatNumber: number, time: number) {
    if (!this.audioContext) return;

    const osc = this.audioContext.createOscillator();
    const envelope = this.audioContext.createGain();

    osc.connect(envelope);
    envelope.connect(this.audioContext.destination);

    // Sound customization
    if (beatNumber === 0) {
      // First beat of bar - High pitch
      osc.frequency.value = 1000;
    } else {
      // Other beats - Lower pitch
      osc.frequency.value = 800;
    }

    envelope.gain.value = 1;
    envelope.gain.exponentialRampToValueAtTime(1, time + 0.001);
    envelope.gain.exponentialRampToValueAtTime(0.001, time + 0.02);

    osc.start(time);
    osc.stop(time + 0.03);

    // Schedule the visual callback
    // We use standard setTimeout for the visual to sync roughly with audio time
    // But since audio time is ahead, we calculate the delay.
    const delay = (time - this.audioContext.currentTime) * 1000;
    // Safety check for negative delay if system lags
    const safeDelay = Math.max(0, delay);
    
    setTimeout(() => {
      if (this.isPlaying && this.onBeatCallback) {
        this.onBeatCallback(beatNumber);
      }
    }, safeDelay);
  }
}
