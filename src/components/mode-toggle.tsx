import { Moon, Sun } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useTheme } from "@/components/theme-provider"
import { useThemeStore } from "./theme-store"

export function ModeToggle() {
  const { setTheme, theme } = useTheme()
  const setTheme2 = useThemeStore((s) => s.setTheme);
  const stTheme = (thm) => {
    setTheme(thm); 
    setTheme2(thm);
  }

  return (
    <Button className="align-middle border-none shadow-none" variant="outline" size="icon" onClick={() => {stTheme(theme == "light"? "dark": "light")}}>
      {theme == "light" && <Sun className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />}
      <Moon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}