import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PlayState, TimeSignature, BackgroundState } from './types';
import { DEFAULT_BPM, DEFAULT_TIME_SIGNATURE, DEFAULT_BACKGROUND, TIME_SIGNATURE_OPTIONS, MIN_BPM, MAX_BPM } from './constants';
import { MetronomeAudio } from './services/metronomeAudio';
import { Visualizer } from './components/Visualizer';
import { SettingsPanel } from './components/SettingsPanel';

// SVG Icons
const PlayIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
);
const StopIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
);
const SettingsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></svg>
);

const App: React.FC = () => {
  // State
  const [playState, setPlayState] = useState<PlayState>(PlayState.STOPPED);
  const [bpm, setBpm] = useState<number>(DEFAULT_BPM);
  const [timeSignature, setTimeSignature] = useState<TimeSignature>(DEFAULT_TIME_SIGNATURE);
  const [activeBeat, setActiveBeat] = useState<number>(-1);
  const [background, setBackground] = useState<BackgroundState>({
    url: DEFAULT_BACKGROUND,
    isGenerated: false,
    isLoading: false,
    prompt: ''
  });
  const [showSettings, setShowSettings] = useState(false);
  const [timerDurationMinutes, setTimerDurationMinutes] = useState<number | null>(null);
  const [timerRemainingSeconds, setTimerRemainingSeconds] = useState<number | null>(null);

  // Refs for Audio Engine
  const metronomeRef = useRef<MetronomeAudio | null>(null);
  const timerIntervalRef = useRef<number | null>(null);

  // Initialize Metronome Audio Class
  useEffect(() => {
    metronomeRef.current = new MetronomeAudio((beatIndex) => {
      setActiveBeat(beatIndex);
    });
    return () => {
      metronomeRef.current?.stop();
    };
  }, []);

  // Sync Settings to Audio Engine
  useEffect(() => {
    if (metronomeRef.current) {
      metronomeRef.current.setBpm(bpm);
      metronomeRef.current.setBeatsPerBar(timeSignature);
    }
  }, [bpm, timeSignature]);

  // Timer Logic
  useEffect(() => {
    // Reset timer when duration changes or if null
    if (timerDurationMinutes === null) {
      setTimerRemainingSeconds(null);
      if (timerIntervalRef.current) window.clearInterval(timerIntervalRef.current);
      return;
    }

    // Initialize timer countdown
    setTimerRemainingSeconds(timerDurationMinutes * 60);
  }, [timerDurationMinutes]);

  useEffect(() => {
    // Handle countdown when playing
    if (playState === PlayState.PLAYING && timerRemainingSeconds !== null && timerRemainingSeconds > 0) {
      timerIntervalRef.current = window.setInterval(() => {
        setTimerRemainingSeconds((prev) => {
          if (prev === null || prev <= 0) {
            handleTogglePlay(); // Stop when done
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) window.clearInterval(timerIntervalRef.current);
    }

    return () => {
      if (timerIntervalRef.current) window.clearInterval(timerIntervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playState, timerRemainingSeconds]);


  const handleTogglePlay = useCallback(() => {
    if (!metronomeRef.current) return;

    if (playState === PlayState.STOPPED) {
      metronomeRef.current.start();
      setPlayState(PlayState.PLAYING);
    } else {
      metronomeRef.current.stop();
      setPlayState(PlayState.STOPPED);
      setActiveBeat(-1);
    }
  }, [playState]);

  const handleBpmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBpm(Number(e.target.value));
  };

  const handleBpmAdjust = (amount: number) => {
    setBpm((prev) => Math.min(MAX_BPM, Math.max(MIN_BPM, prev + amount)));
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="relative h-screen w-screen flex flex-col items-center justify-center text-white overflow-hidden selection:bg-cyan-500 selection:text-black">
      
      {/* Background Layer */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center transition-all duration-1000 ease-in-out"
        style={{ 
            backgroundImage: `url(${background.url})`,
            transform: 'scale(1.05)' 
        }}
      />
      {/* Overlay for contrast */}
      <div className="absolute inset-0 z-0 bg-black/40 backdrop-blur-sm" />

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-lg px-4 flex flex-col items-center">
        
        {/* Header / Timer Display */}
        <div className="absolute top-0 w-full flex justify-between items-center -mt-32 px-4">
             <div className="text-xs font-bold tracking-[0.2em] opacity-50">TEMPOZEN</div>
             {timerRemainingSeconds !== null && (
                 <div className="font-mono text-cyan-400 bg-black/50 px-3 py-1 rounded-full border border-cyan-500/30">
                     {formatTime(timerRemainingSeconds)}
                 </div>
             )}
        </div>

        {/* BPM Display */}
        <div className="flex flex-col items-center mb-10">
          <div className="text-[8rem] font-bold leading-none tracking-tighter tabular-nums text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60 drop-shadow-2xl">
            {bpm}
          </div>
          <div className="text-sm font-medium tracking-[0.3em] text-cyan-200/80 uppercase mt-2">
            Beats Per Minute
          </div>
        </div>

        {/* Visualizer */}
        <Visualizer activeBeat={activeBeat} beatsPerBar={timeSignature} />

        {/* BPM Slider */}
        <div className="w-full flex items-center gap-4 mb-8">
            <button onClick={() => handleBpmAdjust(-1)} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/70">-</button>
            <input
                type="range"
                min={MIN_BPM}
                max={MAX_BPM}
                value={bpm}
                onChange={handleBpmChange}
                className="flex-1 h-2 bg-white/20 rounded-lg appearance-none cursor-pointer hover:bg-white/30 transition-colors"
            />
            <button onClick={() => handleBpmAdjust(1)} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/70">+</button>
        </div>

        {/* Controls Container */}
        <div className="glass-panel p-6 rounded-3xl w-full shadow-2xl">
            
            {/* Play/Stop & Time Signature */}
            <div className="flex justify-between items-center mb-6">
                
                {/* Time Signature Dropdown */}
                <div className="relative">
                    <select 
                        value={timeSignature}
                        onChange={(e) => setTimeSignature(Number(e.target.value) as TimeSignature)}
                        className="appearance-none bg-white/5 border border-white/10 text-white py-2 pl-4 pr-10 rounded-xl focus:outline-none focus:border-cyan-500/50 hover:bg-white/10 transition-all font-mono text-lg cursor-pointer"
                    >
                        {TIME_SIGNATURE_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value} className="bg-gray-900 text-white">
                                {opt.label}
                            </option>
                        ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                    </div>
                </div>

                {/* Main Play Button */}
                <button
                    onClick={handleTogglePlay}
                    className={`
                        w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-105 active:scale-95
                        ${playState === PlayState.PLAYING 
                            ? 'bg-red-500/90 shadow-[0_0_30px_rgba(239,68,68,0.4)] hover:bg-red-500' 
                            : 'bg-cyan-500/90 shadow-[0_0_30px_rgba(6,182,212,0.4)] hover:bg-cyan-500'
                        }
                    `}
                >
                    {playState === PlayState.PLAYING ? <StopIcon /> : <PlayIcon />}
                </button>

                {/* Settings Toggle */}
                <button 
                    onClick={() => setShowSettings(!showSettings)}
                    className={`p-4 rounded-xl transition-all ${showSettings ? 'bg-white/20 text-white' : 'bg-white/5 text-white/60 hover:bg-white/10'}`}
                >
                    <SettingsIcon />
                </button>
            </div>

            {/* Collapsible Settings Area */}
            {showSettings && (
                <SettingsPanel 
                    onBackgroundChange={setBackground} 
                    onTimerSet={(min) => {
                        setTimerDurationMinutes(min);
                        if(min) setTimerRemainingSeconds(min * 60);
                        else setTimerRemainingSeconds(null);
                    }}
                    timerMinutes={timerDurationMinutes}
                />
            )}
        </div>
      </div>
    </div>
  );
};

export default App;
