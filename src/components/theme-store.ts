import { create } from "zustand"

export type Theme = "light" | "dark" | "system"

type ThemeState = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const storageKey = "vite-ui-theme"

export const useThemeStore = create<ThemeState>((set) => ({
  theme: (localStorage.getItem(storageKey) as Theme) || "system",
  setTheme: (theme: Theme) => {
    localStorage.setItem(storageKey, theme)
    set(() => ({ theme }))
  },
}))
