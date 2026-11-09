'use strict';

// Commander treats packaged Electron differently from Electron's Node-compatible
// mode and otherwise keeps the script path as a positional argument.
if (process.versions.electron && !process.defaultApp) {
  Object.defineProperty(process, 'defaultApp', {
    configurable: true,
    value: true,
  });
}