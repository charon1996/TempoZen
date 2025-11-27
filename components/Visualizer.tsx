import React from 'react';

interface VisualizerProps {
  activeBeat: number; // The index of the beat currently playing (0-indexed)
  beatsPerBar: number;
}

export const Visualizer: React.FC<VisualizerProps> = ({ activeBeat, beatsPerBar }) => {
  // Create an array of dots based on beatsPerBar
  const dots = Array.from({ length: beatsPerBar }, (_, i) => i);

  return (
    <div className="flex justify-center items-center gap-4 my-8 h-16">
      {dots.map((beatIndex) => {
        const isActive = activeBeat === beatIndex;
        const isFirstBeat = beatIndex === 0;

        // Dynamic classes for animation
        let sizeClass = "w-4 h-4";
        let colorClass = "bg-white/30";
        
        if (isActive) {
            sizeClass = "w-6 h-6";
            if (isFirstBeat) {
                colorClass = "bg-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.8)]";
            } else {
                colorClass = "bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]";
            }
        } else if (isFirstBeat) {
             // Passive state for first beat is slightly distinct
             sizeClass = "w-5 h-5";
             colorClass = "bg-cyan-900/50 border border-cyan-500/30";
        }

        return (
          <div
            key={beatIndex}
            className={`rounded-full transition-all duration-75 ${sizeClass} ${colorClass}`}
          />
        );
      })}
    </div>
  );
};
