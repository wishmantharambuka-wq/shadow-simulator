"use client";

interface TimeControlsProps {
  timeSteps: string[];
  currentIndex: number;
  interpolatedTime: string;
  isPlaying: boolean;
  speed: number;
  date: string;
  showGround: boolean;
  showFacade: boolean;
  showBaseMap: boolean;
  darkMode: boolean;
  isProcessing: boolean;
  onProgressChange: (value: number) => void;
  onTogglePlay: () => void;
  onSpeedChange: (speed: number) => void;
  onStepBack: () => void;
  onStepForward: () => void;
  onToggleGround: () => void;
  onToggleFacade: () => void;
  onToggleBaseMap: () => void;
  onToggleDarkMode: () => void;
  onProcessNewFiles: () => void;
}

const SPEEDS = [0.5, 1, 2, 4, 8];

export default function TimeControls({
  timeSteps,
  currentIndex,
  interpolatedTime,
  isPlaying,
  speed,
  date,
  showGround,
  showFacade,
  showBaseMap,
  darkMode,
  isProcessing,
  onProgressChange,
  onTogglePlay,
  onSpeedChange,
  onStepBack,
  onStepForward,
  onToggleGround,
  onToggleFacade,
  onToggleBaseMap,
  onToggleDarkMode,
  onProcessNewFiles,
}: TimeControlsProps) {
  const cycleSpeed = () => {
    const idx = SPEEDS.indexOf(speed);
    onSpeedChange(SPEEDS[(idx + 1) % SPEEDS.length]);
  };

  const maxSlider = (timeSteps.length - 1) * 100;

  return (
    <div className="controls-wrapper">
      <div className="glass-panel controls-inner">
        {/* Header row */}
        <div className="controls-header">
          <div>
            <div className="time-display">{interpolatedTime}</div>
            <div className="date-label">{date || "Loading..."} LST</div>
          </div>
          <div className="header-right">
            <div className="layer-toggles">
              <button
                className={`layer-btn ${showGround ? "active" : ""}`}
                onClick={onToggleGround}
              >
                <span className="dot" style={{ background: showGround ? "#1e1e1e" : "#555" }} />
                Ground
              </button>
              <button
                className={`layer-btn ${showFacade ? "active" : ""}`}
                onClick={onToggleFacade}
              >
                <span className="dot" style={{ background: showFacade ? "#FF7A18" : "#555" }} />
                Facade
              </button>
            </div>
            <div className="map-toggles">
              <button
                className={`map-toggle-btn ${showBaseMap ? "active" : ""}`}
                onClick={onToggleBaseMap}
                title="Toggle base map"
              >
                {showBaseMap ? "🗺️" : "🚫"}
              </button>
              <button
                className={`map-toggle-btn ${darkMode ? "" : "light-active"}`}
                onClick={onToggleDarkMode}
                title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
              >
                {darkMode ? "🌙" : "☀️"}
              </button>
            </div>
          </div>
        </div>

        {/* Slider */}
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

        {/* Button row */}
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

          <button
            className={`process-btn ${isProcessing ? "processing" : ""}`}
            onClick={onProcessNewFiles}
            disabled={isProcessing}
            title="Process new TIF files and reload"
          >
            {isProcessing ? (
              <><span className="process-spinner" /> Processing...</>
            ) : (
              "🔄 Reload TIFs"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
