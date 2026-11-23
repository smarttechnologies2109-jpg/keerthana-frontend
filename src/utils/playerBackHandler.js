let collapseFullPlayerHandler = null;

export function setCollapseFullPlayerHandler(handler) {
  collapseFullPlayerHandler = handler;
}

export function collapseFullPlayerIfOpen() {
  if (!collapseFullPlayerHandler) {
    return false;
  }

  return collapseFullPlayerHandler();
}