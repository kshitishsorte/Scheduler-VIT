import { useCallback, useEffect, useState } from "react";
import type { ThemeName } from "@/types";

const STORAGE_KEY = "scheduler-theme";

function systemTheme(): ThemeName {
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function initialTheme(): ThemeName {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === "dark" || stored === "light" ? stored : systemTheme();
}

/**
 * Light/dark theme, applied as `data-theme` on the document element - which is
 * where the stylesheet's theme blocks are keyed.
 *
 * Falls back to the OS preference until the user picks explicitly, then
 * remembers the choice. Storing a theme is not tracking, so no consent needed.
 */
export function useTheme(): { theme: ThemeName; toggle: () => void } {
  const [theme, setTheme] = useState<ThemeName>(initialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  // Keep following the OS while the user has not chosen for themselves.
  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY)) return;

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setTheme(systemTheme());
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  const toggle = useCallback(() => {
    setTheme((current) => {
      const next = current === "dark" ? "light" : "dark";
      localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }, []);

  return { theme, toggle };
}
