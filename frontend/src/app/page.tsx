"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import TimeControls from "@/components/TimeControls";
import SettingsPanel from "@/components/SettingsPanel";

const ShadowMap = dynamic(() => import("@/components/ShadowMap"), {
  ssr: false,
});

interface Metadata {
  bounds: { south: number; north: number; west: number; east: number };
  date: string;
  timeSteps: string[];
  layers: {
    ground: { time: string; file: string }[];
    facade: { time: string; file: string }[];
  };
}

function preloadImages(urls: string[]): Promise<void> {
  return Promise.all(
    urls.map(
      (url) =>
        new Promise<void>((resolve) => {
          const img = new Image();
          img.onload = () => resolve();
          img.onerror = () => resolve();
          img.src = url;
        })
    )
  ).then(() => {});
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = Math.floor(mins % 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function getInterpolatedTime(
  timeSteps: string[],
  progress: number
): string {
  const idxA = Math.floor(progress);
  const idxB = Math.min(idxA + 1, timeSteps.length - 1);
  const frac = progress - idxA;
  const mA = timeToMinutes(timeSteps[idxA]);
  const mB = timeToMinutes(timeSteps[idxB]);
  const interp = mA + frac * (mB - mA);
  return minutesToTime(interp);
}

export default function Home() {
  const [metadata, setMetadata] = useState<Metadata | null>(null);
  const [progress, setProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [showGround, setShowGround] = useState(true);
  const [showFacade, setShowFacade] = useState(true);
  const [showBaseMap, setShowBaseMap] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastTimeRef = useRef<number>(0);
  const animProgressRef = useRef(0);

  const loadMetadata = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/data/metadata.json?t=" + Date.now());
      const data: Metadata = await r.json();
      setMetadata(data);
      const allUrls = [
        ...data.layers.ground.map((l) => `/${l.file}`),
        ...data.layers.facade.map((l) => `/${l.file}`),
      ];
      await preloadImages(allUrls);
    } catch (err) {
      console.error("Failed to load metadata:", err);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadMetadata();
  }, [loadMetadata]);

  useEffect(() => {
    if (!isPlaying || !metadata) return;

    animProgressRef.current = progress;
    lastTimeRef.current = Date.now();

    const maxProgress = metadata.timeSteps.length - 1;
    const framesPerSecond = speed * 0.5;

    timerRef.current = setInterval(() => {
      const now = Date.now();
      const dt = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;

      animProgressRef.current += dt * framesPerSecond;

      if (animProgressRef.current >= maxProgress) {
        setProgress(0);
        setIsPlaying(false);
        return;
      }

      setProgress(animProgressRef.current);
    }, 16);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, speed, metadata]);

  const handleTogglePlay = useCallback(() => {
    if (!metadata) return;
    if (!isPlaying && progress >= metadata.timeSteps.length - 1) {
      setProgress(0);
    }
    setIsPlaying((p) => !p);
  }, [isPlaying, progress, metadata]);

  const handleStepBack = useCallback(() => {
    setIsPlaying(false);
    setProgress((p) => {
      const v = Math.max(0, Math.floor(p) - 1);
      animProgressRef.current = v;
      return v;
    });
  }, []);

  const handleStepForward = useCallback(() => {
    if (!metadata) return;
    setIsPlaying(false);
    setProgress((p) => {
      const v = Math.min(metadata.timeSteps.length - 1, Math.floor(p) + 1);
      animProgressRef.current = v;
      return v;
    });
  }, [metadata]);

  const handleProgressChange = useCallback((val: number) => {
    setIsPlaying(false);
    animProgressRef.current = val;
    setProgress(val);
  }, []);

  const handleProcessNewFiles = useCallback(async () => {
    setIsProcessing(true);
    try {
      const res = await fetch("/api/process", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setProgress(0);
        setIsPlaying(false);
        await loadMetadata();
      } else {
        console.error("Process failed:", data.error);
        alert("Processing failed. Check console for details.");
      }
    } catch (err) {
      console.error("Process request failed:", err);
      alert("Could not reach the processing API.");
    }
    setIsProcessing(false);
  }, [loadMetadata]);

  const idxA = Math.floor(progress);
  const idxB = metadata ? Math.min(idxA + 1, metadata.timeSteps.length - 1) : idxA;
  const blendFactor = idxA === idxB ? 0 : progress - idxA;

  const groundA = metadata?.layers.ground.find((l) => l.time === metadata.timeSteps[idxA]);
  const groundB = metadata?.layers.ground.find((l) => l.time === metadata.timeSteps[idxB]);
  const facadeA = metadata?.layers.facade.find((l) => l.time === metadata.timeSteps[idxA]);
  const facadeB = metadata?.layers.facade.find((l) => l.time === metadata.timeSteps[idxB]);

  const interpolatedTime = metadata
    ? getInterpolatedTime(metadata.timeSteps, progress)
    : "--:--";

  return (
    <div style={{ width: "100%", height: "100vh", position: "relative" }}>
      {loading && (
        <div className="loading-overlay">
          <div className="loading-spinner" />
          <div className="loading-text">Loading shadow layers...</div>
        </div>
      )}

      <ShadowMap
        bounds={metadata?.bounds ?? null}
        groundUrlA={groundA ? `/${groundA.file}` : null}
        groundUrlB={groundB ? `/${groundB.file}` : null}
        facadeUrlA={facadeA ? `/${facadeA.file}` : null}
        facadeUrlB={facadeB ? `/${facadeB.file}` : null}
        blendFactor={blendFactor}
        showGround={showGround}
        showFacade={showFacade}
        showBaseMap={showBaseMap}
        darkMode={darkMode}
      />

      <div className="title-bar glass-panel">
        <h1>
          <span>Shadow</span> Simulator
        </h1>
        <p>Dehiwala Urban Shadow Analysis</p>
      </div>

      <SettingsPanel
        showGround={showGround}
        showFacade={showFacade}
        showBaseMap={showBaseMap}
        darkMode={darkMode}
        isProcessing={isProcessing}
        onToggleGround={() => setShowGround((v) => !v)}
        onToggleFacade={() => setShowFacade((v) => !v)}
        onToggleBaseMap={() => setShowBaseMap((v) => !v)}
        onToggleDarkMode={() => setDarkMode((v) => !v)}
        onProcessNewFiles={handleProcessNewFiles}
      />

      <div className="credits">&copy; Chamod Wishmantha</div>

      {metadata && (
        <TimeControls
          timeSteps={metadata.timeSteps}
          currentIndex={Math.floor(progress)}
          interpolatedTime={interpolatedTime}
          isPlaying={isPlaying}
          speed={speed}
          date={metadata.date}
          onProgressChange={handleProgressChange}
          onTogglePlay={handleTogglePlay}
          onSpeedChange={setSpeed}
          onStepBack={handleStepBack}
          onStepForward={handleStepForward}
        />
      )}
    </div>
  );
}
