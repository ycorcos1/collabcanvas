import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../components/Auth/AuthProvider";
import { firestore } from "../services/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

type Theme = "auto" | "light" | "dark";

interface UseThemeReturn {
  theme: Theme;
  resolvedTheme: "light" | "dark";
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

/**
 * Custom hook for managing theme state with system preference detection
 *
 * Features:
 * - Per-user theme preferences stored in Firestore
 * - Auto-detects system preference
 * - Persists user choice across devices
 * - Applies theme to document element
 * - Provides toggle functionality
 * - Defaults to 'auto' for new users
 */
export const useTheme = (): UseThemeReturn => {
  const { user } = useAuth();

  // Get initial theme - default to 'auto' until loaded from Firestore
  const [theme, setThemeState] = useState<Theme>("auto");

  // Track system preference
  const [systemPreference, setSystemPreference] = useState<"light" | "dark">(
    () => {
      if (typeof window === "undefined") return "light";

      return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    }
  );

  // Calculate resolved theme (what actually gets applied)
  const resolvedTheme: "light" | "dark" =
    theme === "auto" ? systemPreference : theme;

  // Load user's theme preference from Firestore on login
  useEffect(() => {
    if (!user) {
      // User logged out - reset to 'auto'
      setThemeState("auto");
      return;
    }

    const loadUserTheme = async () => {
      try {
        const userDocRef = doc(firestore, "users", user.id);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists() && userDoc.data()?.theme) {
          const savedTheme = userDoc.data().theme as Theme;
          if (["auto", "light", "dark"].includes(savedTheme)) {
            setThemeState(savedTheme);
          }
        } else {
          // New user - set default to 'auto' and save it
          setThemeState("auto");
          await setDoc(userDocRef, { theme: "auto" }, { merge: true });
        }
      } catch (error) {
        console.error("Error loading user theme:", error);
        // Fall back to 'auto' on error
        setThemeState("auto");
      }
    };

    loadUserTheme();
  }, [user]);

  // Set theme and persist to Firestore (per-user)
  const setTheme = useCallback(
    async (newTheme: Theme) => {
      setThemeState(newTheme);

      // Save to Firestore if user is logged in
      if (user) {
        try {
          const userDocRef = doc(firestore, "users", user.id);
          await setDoc(userDocRef, { theme: newTheme }, { merge: true });
        } catch (error) {
          console.error("Error saving user theme:", error);
        }
      }
    },
    [user]
  );

  // Toggle between light and dark (skips auto)
  const toggleTheme = useCallback(() => {
    const newTheme = resolvedTheme === "light" ? "dark" : "light";
    setTheme(newTheme);
  }, [resolvedTheme, setTheme]);

  // Listen for system preference changes
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = (e: MediaQueryListEvent) => {
      setSystemPreference(e.matches ? "dark" : "light");
    };

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
    // Fallback for older browsers
    else {
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, []);

  // Apply theme to document element
  useEffect(() => {
    const root = document.documentElement;

    // Remove existing theme attributes
    root.removeAttribute("data-theme");

    // Apply new theme
    if (resolvedTheme === "dark") {
      root.setAttribute("data-theme", "dark");
    }

    // Also set a class for compatibility
    root.classList.remove("light", "dark");
    root.classList.add(resolvedTheme);
  }, [resolvedTheme]);

  // Prevent flash of wrong theme on initial load
  useEffect(() => {
    // This effect runs after hydration to ensure the theme is applied immediately
    const root = document.documentElement;
    const currentTheme = root.getAttribute("data-theme");

    if (currentTheme !== resolvedTheme) {
      if (resolvedTheme === "dark") {
        root.setAttribute("data-theme", "dark");
      } else {
        root.removeAttribute("data-theme");
      }
      root.classList.remove("light", "dark");
      root.classList.add(resolvedTheme);
    }
  }, []); // Run only once on mount

  return {
    theme,
    resolvedTheme,
    setTheme,
    toggleTheme,
  };
};
