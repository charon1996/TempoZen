import React, { useState } from 'react';
import { BackgroundState } from '../types';
import { generateBackgroundImage } from '../services/geminiService';

interface SettingsPanelProps {
  onBackgroundChange: (bg: BackgroundState) => void;
  onTimerSet: (minutes: number | null) => void;
  timerMinutes: number | null;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ 
  onBackgroundChange, 
  onTimerSet, 
  timerMinutes 
}) => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [localTimer, setLocalTimer] = useState<string>(timerMinutes ? timerMinutes.toString() : '');

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    try {
      const imageUrl = await generateBackgroundImage(prompt);
      onBackgroundChange({
        url: imageUrl,
        isGenerated: true,
        isLoading: false,
        prompt: prompt
      });
    } catch (e) {
      console.error("Failed to generate bg", e);
      alert("Could not generate image. Please check API Key.");
    } finally {
      setLoading(false);
    }
  };

  const handleTimerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalTimer(e.target.value);
  };

  const applyTimer = () => {
    const val = parseInt(localTimer);
    if (!isNaN(val) && val > 0) {
      onTimerSet(val);
    } else {
      onTimerSet(null);
      setLocalTimer('');
    }
  };

  return (
    <div className="glass-panel p-6 rounded-2xl w-full max-w-md mt-6 space-y-6 animate-fade-in">
      {/* Background Gen */}
      <div>
        <h3 className="text-sm uppercase tracking-wider text-gray-400 font-semibold mb-3">AI Ambience</h3>
        <div className="flex gap-2">
          <input
            type="text"
            className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
            placeholder="e.g. Rainy cafe window..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
          <button
            onClick={handleGenerate}
            disabled={loading}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              loading 
                ? 'bg-gray-600 cursor-not-allowed' 
                : 'bg-cyan-600 hover:bg-cyan-500 hover:shadow-[0_0_15px_rgba(6,182,212,0.5)]'
            }`}
          >
            {loading ? 'Thinking...' : 'Dream'}
          </button>
        </div>
      </div>

      {/* Timer */}
      <div>
        <h3 className="text-sm uppercase tracking-wider text-gray-400 font-semibold mb-3">Practice Timer (Minutes)</h3>
        <div className="flex gap-2 items-center">
            <input
                type="number"
                min="1"
                max="120"
                className="w-24 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
                placeholder="None"
                value={localTimer}
                onChange={handleTimerChange}
            />
            <button
                onClick={applyTimer}
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-white/10 hover:bg-white/20 border border-white/10 transition-all"
            >
                {timerMinutes ? 'Update' : 'Set'}
            </button>
            {timerMinutes && (
                 <button
                 onClick={() => { onTimerSet(null); setLocalTimer(''); }}
                 className="px-3 py-2 text-xs text-red-400 hover:text-red-300"
             >
                 Clear
             </button>
            )}
        </div>
      </div>
    </div>
  );
};
