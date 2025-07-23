// components/ParticlesBackground.tsx
import { useCallback } from "react";
import Particles from "react-tsparticles";
import { loadSlim } from "tsparticles-slim";
import type { Engine } from "tsparticles-engine";
import { useThemeStore } from "./theme-store";

const ParticlesBackground = ({ area=500, className="" }) => {
  const particlesInit = useCallback(async (engine: Engine) => {
    await loadSlim(engine);
  }, []);
  const theme = useThemeStore((s) => s.theme);
  const screenWidth = window.innerWidth
    const scaleFactor = screenWidth / 1440;

  return (
    <div className={"pointer-events-none overflow-hidden " + className}>
      <Particles
        id="tsparticles"
        init={particlesInit}
        options={{
          fullScreen: { enable: false },
          detectRetina: true,
          fpsLimit: 120,
          background: {
            color: {
              value: "transparent",
            },
          },
          particles: {
            number: {
              value: theme == "light" ? 50 : 120,
              density: {
                enable: false, // Don't auto-scale to screen
                area: area,
                height: 1000,
              },
            },
            color: {
              value: theme == "light" ? "#19a" : "#22def6",
            },
            shape: {
              type: "circle",
            },
            opacity: {
              value: theme == "light" ? 1 : 0.8,
              animation: {
                enable: theme == "dark",
                speed: 0.4,
                minimumValue: 0.3,
                sync: false,
              },
            },
            size: {
              value:
                theme == "light"
                  ? scaleFactor * 5
                  : { min: scaleFactor * 2, max: scaleFactor * 5 },
              animation: {
                enable: theme == "light" ? false : true,
                speed: 3,
                minimumValue: 0.5,
                sync: false,
              },
            },
            move: {
              enable: true,
              speed: 1,
              direction: "none",
              random: true,
              outModes: {
                default: "bounce",
              },
            },
            links: {
              enable: true,
              distance: scaleFactor * (theme == "light" ? 100 : 150),
              color: theme == "light" ? "#19a" : "#00bcd4",
              opacity: theme == "light" ? 1 : 0.3,
              width: 1.5 * scaleFactor,
            },
          },
          interactivity: {
            events: {
              onClick: { enable: false },
              onHover: { enable: false },
              resize: true,
            },
          },
          // 🟢 THIS is what creates the floating cloud at middle-right
          emitters: [
            {
              position: {
                x: 80, // % from left → middle-right
                y: 50, // center vertically
              },
              size: {
                width: 200, // area width of the cloud
                height: 200, // area height of the cloud
              },
              rate: {
                quantity: 0,
                delay: 0.25,
              },
              particles: {
                move: {
                  speed: 1,
                  outModes: {
                    default: "bounce",
                  },
                },
              },
            },
          ],
        }}
        className="w-full h-full"
      />
    </div>
  );
};

export default ParticlesBackground;
