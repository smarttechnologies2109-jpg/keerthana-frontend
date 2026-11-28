import { useState } from "react";
import { FaTachometerAlt, FaTimes } from "react-icons/fa";
import { usePlayer } from "../context/usePlayer";

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

export default function PlaybackSpeedControl() {
  const { playbackRate, setPlaybackRate } = usePlayer();
  const [open, setOpen] = useState(false);

  return (
    <div className="playback-speed-control">
      <button
        type="button"
        className={playbackRate !== 1 ? "is-active" : ""}
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-label={`Playback speed ${playbackRate} times`}
        title="Playback speed"
      >
        <FaTachometerAlt />
        <span>{playbackRate}×</span>
      </button>

      {open && (
        <div className="playback-speed-popover" role="dialog" aria-label="Playback speed">
          <div className="playback-speed-heading">
            <strong>Playback speed</strong>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close speed settings">
              <FaTimes />
            </button>
          </div>
          <div className="playback-speed-options">
            {SPEEDS.map((speed) => (
              <button
                type="button"
                key={speed}
                className={playbackRate === speed ? "is-selected" : ""}
                aria-pressed={playbackRate === speed}
                onClick={() => {
                  setPlaybackRate(speed);
                  setOpen(false);
                }}
              >
                {speed === 1 ? "Normal" : `${speed}×`}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
