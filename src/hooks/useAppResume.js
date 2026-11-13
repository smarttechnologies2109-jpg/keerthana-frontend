
import { useEffect, useRef } from "react";

export default function useAppResume(onResume) {
  const callbackRef = useRef(onResume);

  useEffect(() => {
    callbackRef.current = onResume;
  }, [onResume]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        callbackRef.current?.();
      }
    };

    window.addEventListener("focus", handleVisibilityChange);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("focus", handleVisibilityChange);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);
}
