import GradientText from "./ui/gradient-text";
import { CLink } from "./ui/cbtn";
import { TypoH1 } from "./ui/ctxt";

export const Hero = () => {
  return (
    <section className="relative w-full h-[85vh] max-h-[1080px] overflow-hidden">
      <div className="relative w-full h-full">
        <div className="relative z-0 flex flex-col items-start justify-center h-full p-10 max-sm:p-5 max-md:items-center">
          <GradientText className="text-start">
            <TypoH1 className="text-6xl max-w-[700px] text-start max-md:text-5xl max-sm:text-4xl max-md:text-center">
              World Leading Medical Research Institute
            </TypoH1>
          </GradientText>

          <GradientText>
            <p className="mt-8 max-w-xl text-gray-700 dark:text-gray-200 max-md:max-w-md pe-10 max-md:text-center max-md:px-0">
              Trusted by institutions, inspired by humanity — we harness
              knowledge to build a healthier world.
            </p>
          </GradientText>

          <div className="flex flex-row gap-8 mt-8">
            <CLink to="/docs">Docs</CLink>
            <CLink to="/articles" outline={true}>
              Articles
            </CLink>
          </div>
        </div>
      </div>
    </section>
  );};

export default Hero;