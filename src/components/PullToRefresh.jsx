
import { useCallback, useRef, useState } from "react";
import "./PullToRefresh.css";

const PULL_THRESHOLD = 75;
const MAX_PULL = 110;

function PullToRefresh({ onRefresh, children, disabled = false }) {
  const startY = useRef(0);
  const pulling = useRef(false);

  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const handleTouchStart = useCallback(
    (event) => {
      if (disabled || refreshing || window.scrollY > 0) return;

      startY.current = event.touches[0].clientY;
      pulling.current = true;
    },
    [disabled, refreshing]
  );

  const handleTouchMove = useCallback(
    (event) => {
      if (!pulling.current || refreshing) return;

      const currentY = event.touches[0].clientY;
      const distance = currentY - startY.current;

      if (distance <= 0) {
        setPullDistance(0);
        return;
      }

      // Only activate when the page is at the top.
      if (window.scrollY > 0) return;

      setPullDistance(Math.min(distance * 0.55, MAX_PULL));
    },
    [refreshing]
  );

  const finishPull = useCallback(async () => {
    if (!pulling.current) return;

    pulling.current = false;

    if (pullDistance >= PULL_THRESHOLD && !refreshing) {
      setRefreshing(true);

      try {
        await onRefresh?.();
      } catch (error) {
        console.error("Pull to refresh failed:", error);
      } finally {
        setRefreshing(false);
      }
    }

    setPullDistance(0);
  }, [onRefresh, pullDistance, refreshing]);

  const handleTouchEnd = () => {
    finishPull();
  };

  const handleTouchCancel = () => {
    pulling.current = false;
    setPullDistance(0);
  };

  const progress = Math.min(pullDistance / PULL_THRESHOLD, 1);

  return (
    <div
      className="pull-refresh-container"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
    >
      {(pullDistance > 0 || refreshing) && (
        <div
          className="pull-refresh-indicator"
          style={{
            height: refreshing ? 55 : pullDistance,
            opacity: refreshing ? 1 : progress,
          }}
        >
          <div className={refreshing ? "refresh-spinner spinning" : "refresh-spinner"}>
            ↻
          </div>

          <span>
            {refreshing
              ? "Refreshing KEERTHANA..."
              : pullDistance >= PULL_THRESHOLD
                ? "Release to refresh"
                : "Pull down to refresh"}
          </span>
        </div>
      )}

      <div className="pull-refresh-content">
        {children}
      </div>
    </div>
  );
}

export default PullToRefresh;
