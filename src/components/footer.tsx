import { Link } from "react-router-dom";
import logo from "../assets/audio-waveform.svg";
import { TypoGradient, TypoH1, TypoP } from "./ui/ctxt";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import GradientText from "./ui/gradient-text";
import { Separator } from "./ui/separator";
import { Copyright } from "lucide-react";

// title, links: [{name, to}]
const Column = ({title, links}) => (
    <div className="flex flex-col flex-wrap min-h-fit gap-5 w-35 min-w-fit">
        <TypoGradient className="mb-5">
            <TypoH1 gradient={true} className="text-xl font-semibold dark:font-bold text-start">
                {title}
            </TypoH1>
        </TypoGradient>
        {links.map((item) => {
            return (
              <Link to={item.to} className="">
                {item.name}
              </Link>
            );
        })}
    </div>
)

const data = [
  {
    title: "Quick Links",
    links: [
      { name: "About Us", to: "/about" },
      { name: "Research Areas", to: "/research-areas" },
      { name: "Publications", to: "/publications" },
      { name: "Events", to: "/news/events" },
      { name: "Contact Us", to: "/contact" },
    ],
  },
  {
    title: "Resources",
    links: [
      { name: "FAQs", to: "/resources/frequently-asked-questions" },
      { name: "Grants", to: "/resources/grants" },
      { name: "Careers", to: "/resources/careers" },
      { name: "Newsroom", to: "/resources/newsroom" },
      { name: "Collaborations", to: "/resources/collaborations" },
    ],
  },
  {
    title: "Stay Updated",
    links: [
      { name: "Newsletter", to: "/media/subscribe" },
      { name: "Webinars", to: "/media/webinars" },
      { name: "Workshops", to: "/media/workshops" },
      { name: "Reports", to: "/resources/reports" },
      { name: "Podcasts", to: "/media/podcasts" },
    ],
  },
];

export const Footer = () => {
  return (
    <div className="flex flex-col max-w-full bg-background py-15 relative mx-0 items-end">
      {/* Top Section */}
      <div className="flex flex-wrap gap-8 px-5 w-full justify-between md:px-10 lg:px-20">
        {/* Logo + Desktop Subscribe */}
        <div className="flex flex-col gap-4 order-1 shrink-0 basis-full md:basis-[calc(33%-1rem)] lg:basis-[20%] me-auto">
          <div className="flex items-center gap-2 min-w-fit w-[350px] ">
            <img src={logo} width={32} alt="Logo" />
            <TypoH1 gradient={true} className="text-xl">
              MedArchive
            </TypoH1>
          </div>
            <Separator className="mb-10 max-w-[200px]"/>
          <div className="flex-row gap-5 max-md:hidden hidden sm:flex">
            <Input
              type="email"
              placeholder="Enter Your Email"
              className="h-12 rounded-none max-md:hidden"
            />
            <Button className="rounded-none max-md:hidden text-dark cursor-pointer hover:bg-accent bg-transparent border-2 dark:hover:border-accent-foreground dark:hover:text-accent-foreground dark:border-white dark:text-white font-medium p-5 h-12">
              Subscribe
            </Button>
          </div>
          <TypoP className="text-[0.7rem] max-md:hidden">
            By subscribing, you agree to our Privacy Policy and consent to receive updates.
          </TypoP>
        </div>

        {/* Navigation Columns */}
        <div className="flex flex-wrap order-2 gap-8 lg:gap-12 max-md:ms-10 max-sm:ms-0">
          {data.map((col, i) => (
            <Column key={i} title={col.title} links={col.links} />
          ))}

          {/* Mobile Subscribe (only visible below md) */}
          <div className="flex flex-col gap-4 min-md:hidden visible mt-10 max-w-sm w-full order-3">
                <GradientText>
                <TypoH1 className="min-md:hidden text-xl font-semibold text-start">
                    Subscribe
                </TypoH1>
                </GradientText>
            <div className="flex flex-col sm:flex-row gap-3">
              <Input
                type="email"
                placeholder="Enter Your Email"
                className="h-12 rounded-none flex-1"
              />
              <Button className="rounded-none text-dark cursor-pointer hover:bg-accent bg-transparent border-2 dark:hover:border-accent-foreground dark:hover:text-accent-foreground dark:border-white dark:text-white font-medium p-5 h-12 whitespace-nowrap">
                Subscribe
              </Button>
            </div>
            <TypoP className="text-[0.7rem]">
              By subscribing, you agree to our Privacy Policy and consent to receive updates.
            </TypoP>
          </div>
        </div>
      </div>

      {/* Bottom Section (empty for now) */}
      <div className="flex flex-wrap px-10 justify-between items-center w-full mt-8 lg:px-20">
        <div className="flex flex-wrap order-1 gap-5 items-center flex-row text-gray-700 text-sm">
            <div className="flex flex-row gap-2 items-center">
                <Copyright size={16} /> MedArchive. All Rights Reserved.
            </div>
            <Link className="underline" to="/privacy-policy">Privacy Policy</Link>
            <Link className="underline" to="/tos">Terms of Service</Link>
            <Link className="underline" to="/cookies">Cookie Settings</Link>
        </div>
      </div>
    </div>
  );
};
