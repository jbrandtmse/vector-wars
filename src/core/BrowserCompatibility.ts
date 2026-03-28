/**
 * BrowserCompatibility — WebGL 2.0 detection and unsupported browser messaging.
 *
 * Provides pre-flight checks that run BEFORE any Three.js initialization.
 * If WebGL 2 is unavailable, displays a styled error overlay instead of
 * a white screen or cryptic WebGL error.
 *
 * Created by: Story 6-3
 */

import { Logger } from './Logger.ts';

/**
 * Tests whether the current browser supports WebGL 2.0.
 * Creates a temporary canvas to probe for a webgl2 rendering context.
 * Returns true if WebGL 2 is available, false otherwise.
 */
export function checkWebGL2Support(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2');
    return gl !== null;
  } catch {
    return false;
  }
}

/**
 * Displays a full-screen error overlay informing the user that WebGL 2.0
 * is required. Styled consistently with the game's green-on-black aesthetic.
 */
export function showUnsupportedMessage(container: HTMLElement): void {
  Logger.warn('Browser', 'WebGL 2.0 not supported — showing unsupported message');

  const overlay = document.createElement('div');
  overlay.id = 'webgl-unsupported-overlay';
  Object.assign(overlay.style, {
    position: 'fixed',
    top: '0',
    left: '0',
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
    color: '#00ff41',
    fontFamily: "'Courier New', monospace",
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: '9999',
    textAlign: 'center',
    padding: '2rem',
  });

  overlay.innerHTML = `
    <div style="font-size:clamp(1.5rem,4vw,3rem);text-shadow:0 0 10px #00ff41,0 0 20px #00ff41;letter-spacing:0.15em;margin-bottom:2rem">
      SYSTEM ERROR
    </div>
    <div style="font-size:clamp(1rem,2.5vw,1.5rem);margin-bottom:1.5rem;opacity:0.9">
      WebGL 2.0 NOT DETECTED
    </div>
    <div style="font-size:clamp(0.8rem,1.5vw,1rem);opacity:0.7;max-width:600px;line-height:1.6">
      Vector Wars requires a browser with WebGL 2.0 support.<br><br>
      Please update to a recent version of Chrome, Firefox, Safari, or Edge.
    </div>
  `;

  container.appendChild(overlay);
}

/**
 * Creates and returns a styled overlay for WebGL context loss recovery.
 * The overlay is hidden by default and can be shown/hidden via style.display.
 */
export function createContextLossOverlay(): HTMLDivElement {
  const overlay = document.createElement('div');
  overlay.id = 'webgl-context-loss-overlay';
  Object.assign(overlay.style, {
    position: 'fixed',
    top: '0',
    left: '0',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    color: '#00ff41',
    fontFamily: "'Courier New', monospace",
    display: 'none',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: '9998',
    textAlign: 'center',
  });

  overlay.innerHTML = `
    <div style="font-size:clamp(1.2rem,3vw,2rem);text-shadow:0 0 10px #00ff41;letter-spacing:0.1em;margin-bottom:1rem">
      GPU CONTEXT LOST
    </div>
    <div style="font-size:clamp(0.8rem,2vw,1.2rem);opacity:0.7">
      Recovering...
    </div>
  `;

  return overlay;
}
