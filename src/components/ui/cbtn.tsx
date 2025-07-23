import { ArrowRight, ChevronRight } from "lucide-react";
import { Button } from "./button.js";
import { Link, Links } from "react-router-dom";

export const CBtn = ({ children, className = "" }) => (
  <Button
    className={
      "min-w-[10rem] min-h-[4.25rem] text-lg text-white bg-button border-2 border-button rounded-xl cursor-pointer hover:bg-cyan-600 " +
      className
    }
  >
    {children}
  </Button>
);

export const CLink = ({ outline=false, to="", arrowSize=16, children, onClick=null, className = ""}) => {
  return (
    <Link
      className={
        (outline
          ? "w-[10rem] h-[4.25rem] text-lg flex items-center justify-center gap-2 text-cyan-400 bg-transparent border-2 border-cyan-400 rounded-xl cursor-pointer hover:bg-button hover:text-white hover:border-button"
          : "min-w-[10rem] min-h-[4.25rem] flex items-center justify-center gap-2 text-lg text-white bg-button border-2 border-button rounded-xl cursor-pointer hover:bg-cyan-600 ") +
        className
      }
      to={to}
      onClick={onClick}
    >
      {children}
      <ArrowRight size={arrowSize} className={ "ml-2 dark:text-inherit text-black " + outline? "text-black": "text-white"} />
    </Link>
  );
};

export const LearnMore = ({ to="", arrowSize=16, arrowClass="", children, className="" }) => {
  return (
    <Link to={to} className={"flex font-medium flex-row gap-2 items-center text-black dark:text-accent-foreground hover:text-accent-foreground dark:hover:text-accent-foreground" + className}>
      {children}
      <ChevronRight size={arrowSize} className={arrowClass} />
    </Link>
  );
}