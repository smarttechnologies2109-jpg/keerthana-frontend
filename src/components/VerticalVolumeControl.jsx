import React, { useEffect, useRef, useState } from "react";
import { FaVolumeUp, FaVolumeDown, FaVolumeMute } from "react-icons/fa";
import "../assets/css/vertical-volume-control.css";

export default function VerticalVolumeControl({ volume = 1, onVolumeChange }) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);
  const previousVolumeRef = useRef(Number(volume) > 0 ? Number(volume) : 1);
  const safeVolume = Math.min(1, Math.max(0, Number(volume) || 0));
  useEffect(() => { if (safeVolume > 0) previousVolumeRef.current = safeVolume; }, [safeVolume]);
  useEffect(() => {
    if (!open) return undefined;
    const outside = (event) => { if (wrapperRef.current && !wrapperRef.current.contains(event.target)) setOpen(false); };
    const escape = (event) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("pointerdown", outside); document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("pointerdown", outside); document.removeEventListener("keydown", escape); };
  }, [open]);
  const Icon = safeVolume === 0 ? FaVolumeMute : safeVolume < 0.5 ? FaVolumeDown : FaVolumeUp;
  const onSpeaker = () => {
    if (!open) { setOpen(true); return; }
    if (safeVolume > 0) { previousVolumeRef.current = safeVolume; onVolumeChange?.(0); }
    else onVolumeChange?.(previousVolumeRef.current || 1);
  };
  return <div className="keerthana-vertical-volume" ref={wrapperRef}>
    {open && <div className="vertical-volume-popup" role="group" aria-label="Volume control">
      <input type="range" className="vertical-volume-slider" min="0" max="1" step="0.01" value={safeVolume}
        onChange={(event) => onVolumeChange?.(Number(event.target.value))}
        style={{ "--volume-fill": `${safeVolume * 100}%` }} aria-label="Adjust music volume" />
    </div>}
    <button type="button" className={`vertical-volume-speaker${open ? " is-open" : ""}`} onClick={onSpeaker}
      aria-label={safeVolume === 0 ? "Unmute or adjust volume" : "Open volume control"} title="Volume"><Icon /></button>
  </div>;
}
