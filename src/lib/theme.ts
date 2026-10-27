export const THEMES = ["system", "light", "dark"] as const;
export type Theme = (typeof THEMES)[number];

export const THEME_STORAGE_KEY = "theme";

export function isTheme(value: unknown): value is Theme {
  return THEMES.includes(value as Theme);
}

/**
 * Runs in <head> before first paint so a saved theme never flashes.
 * "system" is represented by the absence of `data-theme`.
 * With nothing stored (first visit), the default is "light", not the OS preference.
 */
export const themeInitScript = `(function(){try{var t=localStorage.getItem(${JSON.stringify(
  THEME_STORAGE_KEY,
)});if(t==="dark")document.documentElement.setAttribute("data-theme","dark");else if(t!=="system")document.documentElement.setAttribute("data-theme","light")}catch(e){}})()`;
