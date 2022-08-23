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

  if (currentDisplay.id === mouseDisplay.id) {
    return;
  }

  const isMaximized = inkdrop.window.isMaximized();

  inkdrop.window.setPosition(
    mouseDisplay.workArea.x + (currentBounds.x - currentDisplay.workArea.x),
    mouseDisplay.workArea.y + (currentBounds.y - currentDisplay.workArea.y),
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
