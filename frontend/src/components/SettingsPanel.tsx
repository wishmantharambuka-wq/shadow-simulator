"use client";

interface SettingsPanelProps {
  showGround: boolean;
  showFacade: boolean;
  showBaseMap: boolean;
  darkMode: boolean;
  isProcessing: boolean;
  onToggleGround: () => void;
  onToggleFacade: () => void;
  onToggleBaseMap: () => void;
  onToggleDarkMode: () => void;
  onProcessNewFiles: () => void;
}

export default function SettingsPanel({
  showGround,
  showFacade,
  showBaseMap,
  darkMode,
  isProcessing,
  onToggleGround,
  onToggleFacade,
  onToggleBaseMap,
  onToggleDarkMode,
  onProcessNewFiles,
}: SettingsPanelProps) {
  return (
    <div className="settings-panel glass-panel">
      <h3 className="settings-title">Settings</h3>

      <div className="settings-section">
        <div className="settings-section-label">Layers</div>
        <label className="toggle-row" onClick={onToggleGround}>
          <span className="toggle-label">
            <span className="dot" style={{ background: showGround ? "#1e1e1e" : "#555", border: "1px solid #666" }} />
            Ground Shadow
          </span>
          <span className={`toggle-switch ${showGround ? "on" : ""}`}>
            <span className="toggle-knob" />
          </span>
        </label>
        <label className="toggle-row" onClick={onToggleFacade}>
          <span className="toggle-label">
            <span className="dot" style={{ background: showFacade ? "#FF7A18" : "#555" }} />
            Facade Shadow
          </span>
          <span className={`toggle-switch ${showFacade ? "on" : ""}`}>
            <span className="toggle-knob" />
          </span>
        </label>
      </div>

      <div className="settings-divider" />

      <div className="settings-section">
        <div className="settings-section-label">Base Map</div>
        <label className="toggle-row" onClick={onToggleBaseMap}>
          <span className="toggle-label">Show Base Map</span>
          <span className={`toggle-switch ${showBaseMap ? "on" : ""}`}>
            <span className="toggle-knob" />
          </span>
        </label>
        <label className="toggle-row" onClick={onToggleDarkMode}>
          <span className="toggle-label">{darkMode ? "Dark Mode" : "Light Mode"}</span>
          <span className={`toggle-switch mode-switch ${darkMode ? "on" : ""}`}>
            <span className="toggle-knob">{darkMode ? "🌙" : "☀️"}</span>
          </span>
        </label>
      </div>

      <div className="settings-divider" />

      <div className="settings-section">
        <div className="settings-section-label">Data</div>
        <button
          className={`process-btn full-width ${isProcessing ? "processing" : ""}`}
          onClick={onProcessNewFiles}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <><span className="process-spinner" /> Processing...</>
          ) : (
            "Reload TIFs"
          )}
        </button>
      </div>
    </div>
  );
}
