import { useEffect, useRef } from "react";

/*
 * Decorative, low-cost visualizer.
 *
 * Intentionally does not create a MediaElementAudioSourceNode. Connecting a
 * cross-origin audio element to Web Audio can silence playback when the media
 * host does not grant CORS access. Keeping visualization independent ensures
 * the browser's native audio output remains untouched on desktop and Android.
 */
export default function AudioVisualizer({ audio, isPlaying }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return undefined;

    let frame = 0;
    let phase = 0;
    let active = true;

    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.max(1, canvas.clientWidth);
      const height = Math.max(1, canvas.clientHeight);
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    };

    resize();
    const observer = typeof ResizeObserver !== "undefined"
      ? new ResizeObserver(resize)
      : null;
    observer?.observe(canvas);

    const draw = () => {
      if (!active) return;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      context.clearRect(0, 0, width, height);

      const bars = 40;
      const gap = 3;
      const barWidth = Math.max(1, (width - gap * (bars - 1)) / bars);

      for (let index = 0; index < bars; index += 1) {
        const envelope = 0.5 + 0.5 * Math.sin((index / bars) * Math.PI);
        const wave = (Math.sin(phase + index * 0.52) + 1) / 2;
        const level = isPlaying
          ? (0.14 + wave * 0.72) * envelope
          : 0.09 * envelope;
        const barHeight = Math.max(2, level * height * 0.9);
        const x = index * (barWidth + gap);
        const y = (height - barHeight) / 2;
        const gradient = context.createLinearGradient(0, y, 0, y + barHeight);
        gradient.addColorStop(0, "#f2d89e");
        gradient.addColorStop(1, "#a66af0");
        context.fillStyle = gradient;
        context.globalAlpha = isPlaying ? 0.92 : 0.32;

        if (typeof context.roundRect === "function") {
          context.beginPath();
          context.roundRect(x, y, barWidth, barHeight, Math.min(3, barWidth / 2));
          context.fill();
        } else {
          context.fillRect(x, y, barWidth, barHeight);
        }
      }

      context.globalAlpha = 1;
      phase += isPlaying ? 0.085 : 0.012;
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
    <div
      className={`keerthana-audio-visualizer ${isPlaying ? "is-playing" : ""}`}
      aria-label={isPlaying ? "Audio visualizer active" : "Audio visualizer paused"}
      role="img"
    >
      <span className="visualizer-label">LIVE AUDIO</span>
      <canvas ref={canvasRef} />
    </div>
  );
}
