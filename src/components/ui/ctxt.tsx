import { useThemeStore } from "../theme-store";


export const TypoH1 = ({ gradient=false, responsive = false, children, className = "" }) => { 
  const theme = useThemeStore((s) => s.theme);
  return (
  <h1
    className={
      `scroll-m-20 text-center text-4xl font-extrabold tracking-tight text-balance ` +
      ((responsive && theme=="light") || gradient? "bg-gradient-to-r from-[#1783CE] to-[#2EB9B8] bg-clip-text text-transparent "
        : "") +
      className
    }
  >
    {children}
  </h1>
  )
};


export const TypoP = ({ children, className = "" }) => (
  <p className={className}>{children}</p>
);

export const TypoGradient = ({ children, className = "" }) => (
  <h1
    className={
      "text-5xl font-extrabold bg-gradient-to-r from-[#1783CE] to-[#2EB9B8] bg-clip-text text-transparent" +
      className
    }
  >
    {children}
  </h1>
);