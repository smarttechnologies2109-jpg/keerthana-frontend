import { useState } from "react";
import { FaRegClock, FaTimes } from "react-icons/fa";
import { usePlayer } from "../context/usePlayer";

const OPTIONS = [15, 30, 45, 60, 90];

export default function SleepTimerControl() {
  const { sleepTimerEndsAt, startSleepTimer, cancelSleepTimer } = usePlayer();
  const [open, setOpen] = useState(false);

  const remaining = sleepTimerEndsAt
    ? Math.max(0, Math.ceil((sleepTimerEndsAt - Date.now()) / 60000))
    : 0;

  return (
    <div className="sleep-timer-control">
      <button
        type="button"
        className={sleepTimerEndsAt ? "is-active" : ""}
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-label={sleepTimerEndsAt ? `Sleep timer, ${remaining} minutes remaining` : "Set sleep timer"}
        title="Sleep timer"
      >
        <FaRegClock />
        <span>{sleepTimerEndsAt ? `${remaining}m left` : "Sleep timer"}</span>
      </button>

      {open && (
        <div className="sleep-timer-popover" role="dialog" aria-label="Sleep timer options">
          <div className="sleep-timer-heading">
            <div>
              <strong>Sleep timer</strong>
              <small>Pause playback automatically</small>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close sleep timer">
              <FaTimes />
            </button>
          </div>

          <div className="sleep-timer-options">
            {OPTIONS.map((minutes) => (
              <button
                type="button"
                key={minutes}
                onClick={() => {
                  startSleepTimer(minutes);
                  setOpen(false);
                }}
              >
                {minutes} min
              </button>
            ))}
          </div>

          {sleepTimerEndsAt && (
            <button
              type="button"
              className="sleep-timer-cancel"
              onClick={() => {
                cancelSleepTimer();
                setOpen(false);
              }}
            >
              Cancel active timer
            </button>
          )}
        </div>
      )}
    </div>
  );
}
