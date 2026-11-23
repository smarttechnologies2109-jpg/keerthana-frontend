import { useCallback, useEffect, useRef, useState } from "react";

import { usePlayer } from "../context/usePlayer";
import MiniPlayer from "./MiniPlayer";
import FullPlayer from "./FullPlayer";

import {
  setCollapseFullPlayerHandler,
} from "../utils/playerBackHandler";

export default function MusicPlayer() {
  const { currentSong } = usePlayer();

  const [isFullScreen, setIsFullScreen] = useState(false);

  const isFullScreenRef = useRef(false);

  const collapsePlayer = useCallback(() => {
    if (!isFullScreenRef.current) {
      return false;
    }

    isFullScreenRef.current = false;
    setIsFullScreen(false);

    return true;
  }, []);

  const expandPlayer = useCallback(() => {
    isFullScreenRef.current = true;
    setIsFullScreen(true);
  }, []);

  useEffect(() => {
    setCollapseFullPlayerHandler(() => {
      return collapsePlayer();
    });

    return () => {
      setCollapseFullPlayerHandler(null);
    };
  }, [collapsePlayer]);

  if (!currentSong) return null;

  return isFullScreen ? (
    <FullPlayer onCollapse={collapsePlayer} />
  ) : (
    <MiniPlayer onExpand={expandPlayer} />
  );
}