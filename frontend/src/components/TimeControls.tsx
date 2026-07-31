"use client";

interface TimeControlsProps {
  timeSteps: string[];
  currentIndex: number;
  interpolatedTime: string;
  isPlaying: boolean;
  speed: number;
  date: string;
  onProgressChange: (value: number) => void;
  onTogglePlay: () => void;
  onSpeedChange: (speed: number) => void;
  onStepBack: () => void;
  onStepForward: () => void;
}

const SPEEDS = [0.5, 1, 2, 4, 8];

export default function TimeControls({
  timeSteps,
  currentIndex,
  interpolatedTime,
  isPlaying,
  speed,
  date,
  onProgressChange,
  onTogglePlay,
  onSpeedChange,
  onStepBack,
  onStepForward,
}: TimeControlsProps) {
  const cycleSpeed = () => {
    const idx = SPEEDS.indexOf(speed);
    onSpeedChange(SPEEDS[(idx + 1) % SPEEDS.length]);
  };

  const maxSlider = (timeSteps.length - 1) * 100;

  return (
    <div className="playback-bar">
      <div className="glass-panel playback-inner">
        <div className="playback-left">
          <div className="time-display">{interpolatedTime}</div>
          <div className="date-label">{date || "Loading..."} LST</div>
        </div>

        <div className="playback-center">
          <div className="slider-row">
            <span className="slider-label">{timeSteps[0] ?? ""}</span>
            <input
              type="range"
              className="time-slider"
              min={0}
              max={maxSlider}
              step={1}
              value={currentIndex * 100}
              onChange={(e) => onProgressChange(Number(e.target.value) / 100)}
            />
            <span className="slider-label">{timeSteps[timeSteps.length - 1] ?? ""}</span>
          </div>

          <div className="btn-row">
            <button className="ctrl-btn" onClick={onStepBack} title="Previous frame">
              ⏮
            </button>
            <button
              className={`ctrl-btn play-btn ${isPlaying ? "playing" : ""}`}
              onClick={onTogglePlay}
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? "⏸" : "▶"}
            </button>
            <button className="ctrl-btn" onClick={onStepForward} title="Next frame">
              ⏭
            </button>
            <div className="speed-label">
              Speed
              <button className="speed-badge" onClick={cycleSpeed}>
                {speed}x
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
