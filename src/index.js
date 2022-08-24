'use babel';

import * as remote from '@electron/remote';

const GLOBAL_OPEN_COMMANDS = [
  'application:toggle-main-window',
  'application:show-and-focus-main-window',
];

let onHideCallback = null;
let onShowCallback = null;
let onOpenCommandCallback = null;

let isHidden = false;

function onHide() {
  isHidden = true;
}

function onShow() {
  isHidden = false;
}

function getNewPosition(currentBounds, currentDisplay, mouseDisplay, axis) {
  const currentPosition = currentBounds[axis];

  const mouseDisplayStart = mouseDisplay.bounds[axis];
  const currentDisplayStart = currentDisplay.bounds[axis];

  const workAreaStart = mouseDisplay.workArea[axis];
  const workAreaSize = mouseDisplay.workArea[axis === 'x' ? 'width' : 'height'];

  const newPosition =
    mouseDisplayStart + (currentPosition - currentDisplayStart);

  if (
    newPosition < workAreaStart ||
    newPosition >= workAreaStart + workAreaSize
  ) {
    return workAreaStart;
  }

  return newPosition;
}

function onOpenCommand() {
  // This event handler is called after hide/show events
  // Therefore, if isHidden is false, the command is used to focus Inkdrop
  if (isHidden) {
    return;
  }

  const currentBounds = inkdrop.window.getBounds();
  const currentDisplay = remote.screen.getDisplayMatching(currentBounds);

  const mouseLocation = remote.screen.getCursorScreenPoint();
  const mouseDisplay = remote.screen.getDisplayNearestPoint(mouseLocation);

  if (
    currentDisplay.bounds.x === mouseDisplay.bounds.x &&
    currentDisplay.bounds.y === mouseDisplay.bounds.y
  ) {
    return;
  }

  const isMaximized = inkdrop.window.isMaximized();

  inkdrop.window.setPosition(
    getNewPosition(currentBounds, currentDisplay, mouseDisplay, 'x'),
    getNewPosition(currentBounds, currentDisplay, mouseDisplay, 'y'),
  );

  if (isMaximized) {
    inkdrop.window.maximize();
  }
}

export function activate() {
  if (!inkdrop.isMainWindow) {
    return;
  }

  onOpenCommandCallback = () => onOpenCommand();
  for (const command of GLOBAL_OPEN_COMMANDS) {
    inkdrop.main.on(command, onOpenCommandCallback);
  }

  onHideCallback = () => onHide();
  inkdrop.window.on('hide', onHideCallback);

  onShowCallback = () => onShow();
  inkdrop.window.on('show', onShowCallback);
}

export function deactivate() {
  if (onHideCallback !== null) {
    inkdrop.window.off('hide', onHideCallback);
    onHideCallback = null;
  }

  if (onShowCallback !== null) {
    inkdrop.window.off('show', onShowCallback);
    onShowCallback = null;
  }

  if (onOpenCommandCallback !== null) {
    for (const command of GLOBAL_OPEN_COMMANDS) {
      inkdrop.main.off(command, onOpenCommandCallback);
    }

    onOpenCommandCallback = null;
  }
}
