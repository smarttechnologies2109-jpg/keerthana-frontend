import React, { useEffect, useRef, useState } from "react";

import { FaMoon, FaTimes } from "react-icons/fa";
import { usePlayer } from "../context/usePlayer";
import "../assets/css/sleepTimer.css";

const TIMER_KEY = "keerthana_sleep_timer";
const MINUTES_KEY = "keerthana_sleep_timer_minutes";

function SleepTimer() {
  const { togglePlay, isPlaying } = usePlayer();
  const [selectedMinutes, setSelectedMinutes] = useState(null);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [endTime, setEndTime] = useState(null);
  const [showTimer, setShowTimer] = useState(false);
  const rootRef = useRef(null);
  const isPlayingRef = useRef(isPlaying);
  const togglePlayRef = useRef(togglePlay);
  const finishedRef = useRef(false);

  const timerOptions = [5, 10, 15, 20, 30, 45, 60, 90];

  useEffect(() => {
    isPlayingRef.current = isPlaying;
    togglePlayRef.current = togglePlay;
  }, [isPlaying, togglePlay]);

  // Restore an active timer after a page refresh or app restart.
  useEffect(() => {
    const savedEndTime = Number(localStorage.getItem(TIMER_KEY));
    const savedMinutes = Number(localStorage.getItem(MINUTES_KEY));

    if (!Number.isFinite(savedEndTime) || savedEndTime <= Date.now()) {
      localStorage.removeItem(TIMER_KEY);
      localStorage.removeItem(MINUTES_KEY);
      return;
    }

    setEndTime(savedEndTime);
    setSelectedMinutes(savedMinutes || null);
    setRemainingSeconds(Math.max(0, Math.ceil((savedEndTime - Date.now()) / 1000)));
  }, []);

  // Recalculate from the saved end timestamp so background throttling is safe.
  useEffect(() => {
    if (!endTime) return undefined;

    const updateRemaining = () => {
      const remaining = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
      setRemainingSeconds(remaining);

      if (remaining <= 0 && !finishedRef.current) {
        finishedRef.current = true;
        localStorage.removeItem(TIMER_KEY);
        localStorage.removeItem(MINUTES_KEY);
        setEndTime(null);
        setSelectedMinutes(null);
        setRemainingSeconds(0);
        setShowTimer(false);
        if (isPlayingRef.current) togglePlayRef.current?.();
      }
    };

    updateRemaining();
    const intervalId = window.setInterval(updateRemaining, 1000);
    return () => window.clearInterval(intervalId);
  }, [endTime]);

  // Close the popup on outside click or Escape. This does not cancel the timer.
  useEffect(() => {
    if (!showTimer) return undefined;

    const handlePointerDown = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setShowTimer(false);
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setShowTimer(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [showTimer]);

  const startTimer = (minutes) => {
    const numericMinutes = Number(minutes);
    if (!Number.isFinite(numericMinutes) || numericMinutes <= 0) return;

    const nextEndTime = Date.now() + numericMinutes * 60 * 1000;
    finishedRef.current = false;
    localStorage.setItem(TIMER_KEY, String(nextEndTime));
    localStorage.setItem(MINUTES_KEY, String(numericMinutes));
    setEndTime(nextEndTime);
    setSelectedMinutes(numericMinutes);
    setRemainingSeconds(numericMinutes * 60);
    setShowTimer(false);
  };

  const cancelTimer = () => {
    localStorage.removeItem(TIMER_KEY);
    localStorage.removeItem(MINUTES_KEY);
    finishedRef.current = false;
    setEndTime(null);
    setSelectedMinutes(null);
    setRemainingSeconds(0);
    setShowTimer(false);
  };

  const formatTime = () => {
    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = remainingSeconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  };

  return (
    <div className="sleep-timer" ref={rootRef}>
      <button
        type="button"
        className={selectedMinutes ? "sleep-timer-button active" : "sleep-timer-button"}
        onClick={() => setShowTimer((current) => !current)}
        title="Sleep Timer"
        aria-label="Sleep Timer"
        aria-expanded={showTimer}
      >
        <FaMoon />
        {selectedMinutes && <span>{formatTime()}</span>}
      </button>

      {showTimer && (
        <div className="sleep-timer-popup" role="dialog" aria-label="Sleep Timer">
          <div className="sleep-timer-header">
            <div>
              <FaMoon />
              <div>
                <strong>Sleep Timer</strong>
                <span>Stop music automatically</span>
              </div>
            </div>
            <button
              type="button"
              className="sleep-timer-close"
              onClick={() => setShowTimer(false)}
              aria-label="Close Sleep Timer"
            >
              <FaTimes />
            </button>
          </div>

          <div className="sleep-timer-options">
            {timerOptions.map((minutes) => (
              <button
                type="button"
                key={minutes}
                className={selectedMinutes === minutes ? "selected" : ""}
                onClick={() => startTimer(minutes)}
              >
                {minutes} {minutes === 1 ? "Minute" : "Minutes"}
              </button>
            ))}
          </div>

          {selectedMinutes && (
            <div className="sleep-timer-current">
              <span>Music will stop in</span>
              <strong>{formatTime()}</strong>
              <button type="button" onClick={cancelTimer}>Cancel Timer</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default SleepTimer;
