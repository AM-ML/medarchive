import dog from "../assets/notfound.svg";
import doge from "../assets/notfound-light.svg";
import { useThemeStore } from "@/components/theme-store";
import { TypoH1 } from "@/components/ui/ctxt";
import { CLink } from "@/components/ui/cbtn";
import ParticlesBackground from "@/components/particles";
import { useNavigate } from "react-router-dom";

export const NotFound = () => {
  const theme = useThemeStore((s) => s.theme);
  const nav = useNavigate();
  return (
    <div className="flex flex-row gap-10 flex-wrap w-full h-[87vh] pb-20 items-center justify-center">
        <ParticlesBackground className="fixed inset-0 w-full h-full z-0" />
      <div className="flex flex-row gap-10 items-center flex-wrap justify-center">
        <img src={theme == "dark" ? dog : doge} className="w-[200px] md:hidden" />
        <div className="flex flex-col justify-center items-center flex-wrap gap-10">
          <div className="flex flex-row flex-wrap items-end justify-center gap-5">
            <TypoH1 gradient={true} className="text-8xl max-md:text-5xl">404</TypoH1>
            <TypoH1 gradient={true} className="text-5xl md:mb-2 max-md:text-2xl">NOT FOUND</TypoH1>
          </div>
          <div className="flex flex-row min-w-max justify-center md:gap-10 w-full">
            <CLink arrowSize={20} outline={true} onClick={() => {nav(-1)}} className="w-max text-md hover:bg-inherit dark:hover:text-cyan-300 border-none group">
              <TypoH1 gradient={false} className="text-[1.2rem] max-md:text-[1rem] p-0 m-0 items-center dark:text-inherit text-black font-normal group-hover:underline">
                Go Back
              </TypoH1>
            </CLink>
            <CLink arrowSize={20} outline={true} to="/" className="w-max text-md hover:bg-inherit dark:hover:text-cyan-300 text-black border-none group">
              <TypoH1 gradient={false} className="text-[1.2rem] max-md:text-[1rem] p-0 m-0 items-center text-black dark:text-inherit font-normal group-hover:underline">
                Go Home
              </TypoH1>
            </CLink>
          </div>
        </div>
        <img src={theme == "dark" ? dog : doge} className="w-[200px] max-md:hidden" />
      </div>
    </div>
  );
};
