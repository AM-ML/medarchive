import { Hero } from "@/components/hero-section";
import { Main } from "@/components/home-main";
import ParticlesBackground from "@/components/particles"; // adjust path as needed
import { useThemeStore } from "@/components/theme-store";

export const Home = () => {
  const theme = useThemeStore((s) => s.theme);

  return (
    <>
      {/* Fixed, full screen particles background */}
      {theme === "dark" && (
        <ParticlesBackground className="fixed inset-0 w-full h-full z-0" />
      )}
      {theme === "light" && (
        <ParticlesBackground
          area={300}
          className="fixed inset-0 w-full h-full z-0"
        />
      )}

      {/* Main content */}
      <div className="relative">
        <Hero />
        <Main />
      </div>
    </>
  );
};
