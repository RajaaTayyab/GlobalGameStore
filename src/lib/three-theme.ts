import * as THREE from "three";

/**
 * Shared theme bridge for all Three.js scenes.
 *
 * Reads the active mode from `data-mode` (set by the Navbar toggle) and lerps
 * the Vault & Chrome accent colours so every 3D section re-tints in sync with
 * the light/dark UI instead of shipping its own hardcoded palette.
 */

export const THEME_KEY = "gts-theme";

const DARK = {
  chrome: new THREE.Color(0xc9af8c),
  oxblood: new THREE.Color(0xa8465a),
  instock: new THREE.Color(0x5fae87),
};

const LIGHT = {
  chrome: new THREE.Color(0x8a6b45),
  oxblood: new THREE.Color(0x7a2432),
  instock: new THREE.Color(0x2b6e4c),
};

export function themeIsLight(): boolean {
  if (typeof window === "undefined") return false;
  const mode =
    document.documentElement.getAttribute("data-mode") ||
    localStorage.getItem(THEME_KEY);
  return mode === "light";
}

export function observeThemeMode(handler: () => void): () => void {
  const observer = new MutationObserver(handler);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-mode"],
  });
  return () => observer.disconnect();
}

/**
 * Shared colour instances + an eased 0→1 mix (0 = dark, 1 = light). Materials
 * reference `chrome`/`oxblood`/`instock` directly, so calling `tick()` inside
 * the render loop re-tints everything with zero allocations.
 */
export class ThemePalette {
  chrome = new THREE.Color().copy(DARK.chrome);
  oxblood = new THREE.Color().copy(DARK.oxblood);
  instock = new THREE.Color().copy(DARK.instock);

  private mix = 0;
  private target = 0;

  init(light: boolean) {
    this.target = light ? 1 : 0;
    this.mix = this.target;
    this.apply(this.target);
  }

  setLight(light: boolean) {
    this.target = light ? 1 : 0;
  }

  /** Ease toward the target mode. Returns true while a visual change is pending. */
  tick(ease = 0.07): boolean {
    const delta = this.target - this.mix;
    if (Math.abs(delta) < 0.0005) {
      this.mix = this.target;
      return false;
    }
    this.mix += delta * ease;
    this.apply(this.mix);
    return true;
  }

  /** Interpolate a parameter between its dark and light variants. */
  n(dark: number, light: number) {
    return dark + (light - dark) * this.mix;
  }

  private apply(mix: number) {
    this.chrome.lerpColors(DARK.chrome, LIGHT.chrome, mix);
    this.oxblood.lerpColors(DARK.oxblood, LIGHT.oxblood, mix);
    this.instock.lerpColors(DARK.instock, LIGHT.instock, mix);
  }
}

/** Unique per-scene shapes need unique 3D seed drift so sections don't mirror each other. */
export function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}