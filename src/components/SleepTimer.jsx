import React, {
  useEffect,
  useState,
} from "react";

import {
  FaMoon,
  FaTimes,
} from "react-icons/fa";

import {
  usePlayer,
} from "../context/usePlayer";

import "../assets/css/sleepTimer.css";

function SleepTimer() {
  const {
    togglePlay,
    isPlaying,
  } = usePlayer();

  const [selectedMinutes, setSelectedMinutes] =
    useState(null);

  const [remainingSeconds, setRemainingSeconds] =
    useState(0);

  const [showTimer, setShowTimer] =
    useState(false);

  /* =====================================================
     AVAILABLE TIMER OPTIONS
  ===================================================== */

  const timerOptions = [
    5,
    10,
    15,
    20,
    30,
    45,
    60,
    90,
  ];

  /* =====================================================
     LOAD SAVED TIMER
  ===================================================== */

  useEffect(() => {
    const savedEndTime =
      localStorage.getItem(
        "keerthana_sleep_timer"
      );

    if (!savedEndTime) {
      return;
    }

    const endTime =
      Number(savedEndTime);

    const remaining =
      Math.max(
        0,
        Math.ceil(
          (endTime - Date.now()) / 1000
        )
      );

    if (remaining > 0) {
      setRemainingSeconds(remaining);

      const savedMinutes =
        localStorage.getItem(
          "keerthana_sleep_timer_minutes"
        );

      if (savedMinutes) {
        setSelectedMinutes(
          Number(savedMinutes)
        );
      }
    } else {
      localStorage.removeItem(
        "keerthana_sleep_timer"
      );

      localStorage.removeItem(
        "keerthana_sleep_timer_minutes"
      );
    }
  }, []);

  /* =====================================================
     TIMER COUNTDOWN
  ===================================================== */

  useEffect(() => {
    if (remainingSeconds <= 0) {
      return;
    }

    const timer =
      setInterval(() => {
        setRemainingSeconds(
          (current) =>
            Math.max(
              0,
              current - 1
            )
        );
      }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, [remainingSeconds]);

  /* =====================================================
     STOP MUSIC WHEN TIMER FINISHES
  ===================================================== */

  useEffect(() => {
    if (remainingSeconds !== 0) {
      return;
    }

    const savedTimer =
      localStorage.getItem(
        "keerthana_sleep_timer"
      );

    if (!savedTimer) {
      return;
    }

    localStorage.removeItem(
      "keerthana_sleep_timer"
    );

    localStorage.removeItem(
      "keerthana_sleep_timer_minutes"
    );

    setSelectedMinutes(null);

    if (isPlaying) {
      togglePlay();
    }
  }, [
    remainingSeconds,
    isPlaying,
    togglePlay,
  ]);

  /* =====================================================
     SET TIMER
  ===================================================== */

  const startTimer = (minutes) => {
    const seconds =
      minutes * 60;

    const endTime =
      Date.now() +
      seconds * 1000;

    localStorage.setItem(
      "keerthana_sleep_timer",
      String(endTime)
    );

    localStorage.setItem(
      "keerthana_sleep_timer_minutes",
      String(minutes)
    );

    setSelectedMinutes(minutes);

    setRemainingSeconds(seconds);

    setShowTimer(false);
  };

  /* =====================================================
     CANCEL TIMER
  ===================================================== */

  const cancelTimer = () => {
    localStorage.removeItem(
      "keerthana_sleep_timer"
    );

    localStorage.removeItem(
      "keerthana_sleep_timer_minutes"
    );

    setSelectedMinutes(null);

    setRemainingSeconds(0);

    setShowTimer(false);
  };

  /* =====================================================
     FORMAT TIME
  ===================================================== */

  const formatTime = () => {
    const minutes =
      Math.floor(
        remainingSeconds / 60
      );

    const seconds =
      remainingSeconds % 60;

    return `${String(minutes).padStart(
      2,
      "0"
    )}:${String(seconds).padStart(
      2,
      "0"
    )}`;
  };

  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <div className="sleep-timer">

      {/* TIMER BUTTON */}

      <button
        type="button"
        className={
          selectedMinutes
            ? "sleep-timer-button active"
            : "sleep-timer-button"
        }
        onClick={() =>
          setShowTimer(
            (current) => !current
          )
        }
        title="Sleep Timer"
      >
        <FaMoon />

        {selectedMinutes && (
          <span>
            {formatTime()}
          </span>
        )}
      </button>

      {/* TIMER POPUP */}

      {showTimer && (
        <div className="sleep-timer-popup">

          {/* HEADER */}

          <div className="sleep-timer-header">

            <div>
              <FaMoon />

              <div>
                <strong>
                  Sleep Timer
                </strong>

                <span>
                  Stop music automatically
                </span>
              </div>
            </div>

            <button
              type="button"
              className="sleep-timer-close"
              onClick={() =>
                setShowTimer(false)
              }
              aria-label="Close"
            >
              <FaTimes />
            </button>

          </div>

          {/* TIMER OPTIONS */}

          <div className="sleep-timer-options">

            {timerOptions.map(
              (minutes) => (
                <button
                  type="button"
                  key={minutes}
                  className={
                    selectedMinutes ===
                    minutes
                      ? "selected"
                      : ""
                  }
                  onClick={() =>
                    startTimer(minutes)
                  }
                >
                  {minutes}{" "}
                  {minutes === 1
                    ? "Minute"
                    : "Minutes"}
                </button>
              )
            )}

          </div>

          {/* CURRENT TIMER */}

          {selectedMinutes && (
            <div className="sleep-timer-current">

              <span>
                Music will stop in
              </span>

              <strong>
                {formatTime()}
              </strong>

              <button
                type="button"
                onClick={cancelTimer}
              >
                Cancel Timer
              </button>

            </div>
          )}

        </div>
      )}

    </div>
  );
}

export default SleepTimer;