import { useEffect, useRef } from "react";

/*
 * Lightweight player visualizer. Uses one MediaElementSource per audio
 * element and keeps the audio routed through the original output.
 * If Web Audio is unavailable, a CSS animation remains as a graceful fallback.
 */
const audioGraphs = new WeakMap();

function getAnalyser(audio) {
  if (!audio || typeof window === "undefined") return null;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;
  try {
    let graph = audioGraphs.get(audio);
    if (!graph) {
      const context = new AudioContextClass();
      const source = context.createMediaElementSource(audio);
      const analyser = context.createAnalyser();
      analyser.fftSize = 128;
      analyser.smoothingTimeConstant = 0.82;
      source.connect(analyser);
      analyser.connect(context.destination);
      graph = { context, analyser };
      audioGraphs.set(audio, graph);
    }
    if (graph.context.state === "suspended") graph.context.resume().catch(() => {});
    return graph.analyser;
  } catch (error) {
    // A media element may already be connected by another feature/browser.
    console.debug("KEERTHANA visualizer fallback:", error);
    return null;
  }
}

export default function AudioVisualizer({ audio, isPlaying }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context2d = canvas?.getContext("2d");
    if (!canvas || !context2d) return undefined;

    let frame = 0;
    let analyser = null;
    let data = null;
    let phase = 0;
    let active = true;

    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.max(1, canvas.clientWidth);
      const height = Math.max(1, canvas.clientHeight);
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context2d.setTransform(ratio, 0, 0, ratio, 0, 0);
    };
    resize();
    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(resize) : null;
    observer?.observe(canvas);

    const draw = () => {
      if (!active) return;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      context2d.clearRect(0, 0, width, height);
      if (isPlaying && audio && !analyser) {
        analyser = getAnalyser(audio);
        if (analyser) data = new Uint8Array(analyser.frequencyBinCount);
      }
      if (analyser && data && isPlaying) analyser.getByteFrequencyData(data);

      const bars =  fortyBars;
      const gap = 3;
      const barWidth = Math.max(2, (width - gap * (bars - 1)) / bars);
      for (let index = 0; index < bars; index += 1) {
        const frequency = data ? data[Math.floor(index / bars * data.length)] / 255 : 0;
        const wave = (Math.sin(phase + index * 0.55) + 1) / 2;
        const level = isPlaying ? Math.max(0.12, frequency || wave * 0.34) : 0.08;
        const barHeight = Math.max(3, level * height * 0.92);
        const x = index * (barWidth + gap);
        const gradient = context2d.createLinearGradient(0, height - barHeight, 0, height);
        gradient.addColorStop(0, "#f2d89e");
        gradient.addColorStop(1, "#669dff");
        context2d.fillStyle = gradient;
        context2d.globalAlpha = isPlaying ? 0.95 : 0.38;
        context2d.beginPath();
        const radius = Math.min(3, barWidth / 2);
        context2d.roundRect(x, (height - barHeight) / 2, barWidth, barHeight, radius);
        context2d.fill();
      }
      context2d.globalAlpha = 1;
      phase += isPlaying ? 0.09 : 0.015;
      frame = window.requestAnimationFrame(draw);
    };
    frame = window.requestAnimationFrame(draw);
    return () => {
      active = false;
      window.cancelAnimationFrame(frame);
      observer?.disconnect();
    };
  }, [audio, isPlaying]);

  return (
    <div className={`keerthana-audio-visualizer ${isPlaying ? "is-playing" : ""}`} aria-label={isPlaying ? "Audio visualizer active" : "Audio visualizer paused"} role="img">
      <span className="visualizer-label">LIVE AUDIO</span>
      <canvas ref={canvasRef} />
    </div>
  );
}

const fortyBars = 40;
