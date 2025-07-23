// components/theme-provider.tsx
import { useEffect } from "react"
import { useThemeStore } from "./theme-store";

type ThemeProviderProps = {
  children: React.ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const theme = useThemeStore((state) => state.theme)

 useEffect(() => {
   if (theme !== "system") return;

   const media = window.matchMedia("(prefers-color-scheme: dark)");
   const handleChange = () => {
     document.documentElement.classList.remove("light", "dark");
     document.documentElement.classList.add(media.matches ? "dark" : "light");
   };

   media.addEventListener("change", handleChange);
   handleChange();

   return () => media.removeEventListener("change", handleChange);
 }, [theme]); 

  return children as JSX.Element
}
