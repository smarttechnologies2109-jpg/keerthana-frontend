
import { useCallback, useState } from "react";

import { usePlayer } from "../context/usePlayer";
import MiniPlayer from "./MiniPlayer";
import FullPlayer from "./FullPlayer";

export default function MusicPlayer() {
  const { currentSong } = usePlayer();
  const [isFullScreen, setIsFullScreen] = useState(false);

  const collapsePlayer = useCallback(() => {
    setIsFullScreen(false);
  }, []);

  if (!currentSong) return null;

  return isFullScreen ? (
    <FullPlayer onCollapse={collapsePlayer} />
  ) : (
    <MiniPlayer onExpand={() => setIsFullScreen(true)} />
  );
}
