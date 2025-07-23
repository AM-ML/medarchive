import { BriefcaseMedical, ChevronRight, HeartHandshake, HeartPulse, Link, Mail, MapPin, PartyPopper, Phone, UserRoundSearch } from "lucide-react"
import { TypoH1, TypoP } from "./ui/ctxt"
import { LearnMore } from "./ui/cbtn";
import { Link as Linker} from "react-router-dom" ;

const InfoCard = ({ Icon, title, desc, to="", LinkElem=null}) => {
    return (
      <div className="flex flex-col items-center gap-5 justify-center bg-white dark:bg-transparent primary-foreground px-5 min-h-max h-300px min-w-[300px] w-[100px] grow max-w-[400px]">
        <div className="text-cyan-500">
          <Icon size={56} />
        </div>
        <TypoH1 className="font-semibold dark:font-bold text-[1.4rem] tracking-tight text-balance max-md:text-[1.2rem]">
          {title}
        </TypoH1>
        <TypoP className="text-center max-md:text-sm">{desc}</TypoP>
        {LinkElem ? LinkElem : <LearnMore to={to} className=" mt-auto">Learn More</LearnMore>}
      </div>
    );
}


const Sect1 = () => (
  <section className="flex flex-col w-full px-10 mb-5 gap-35 items-center bg-white dark:bg-transparent">
    <div className="w-full text-center">
      <TypoH1 gradient={true} className="text-5xl max-md:text-4xl max-sm:text-2xl max-w-180 m-auto">
        Exploring Innovative Solutions in Medical Research and Healthcare
        Advancements
      </TypoH1>
    </div>

    <div className="flex flex-row flex-wrap gap-15 justify-center">
      <InfoCard
        Icon={UserRoundSearch}
        title="Pioneering Research in Disease Prevention and Treatment Strategies"
        desc="Our institute is dedicated to groundbreaking research that transforms patient care."
        to="/about/overview"
      />
      <InfoCard
        Icon={PartyPopper}
        title="Celebrating Milestones: Our Notable Achievements in Medical Science"
        desc="We have achieved significant breakthroughs that have reshaped medical practices worldwide."
        to=""
      />
      <InfoCard
        Icon={Link}
        title="Strategic Initiatives for Future-Driven Medical Research and Collaboration"
        desc="Our strategic initiatives focus on fostering collaboration and innovation across disciplines."
        to=""
      />
    </div>
  </section>
);

const Sect2 = () => (
  <section className="flex flex-col w-full px-10 mb-5 gap-35 items-center bg-white dark:bg-transparent mt-50">
    <div className="flex flex-row items-center justify-center gap-y-10 flex-wrap max-[1000px]:gap-y-5">
      <TypoH1 gradient={true} className="text-5xl text-start inline max-w-160 max-md:max-w-full">
        Comprehensive Services Tailored to Advance Medical Research and Patient
        Care
      </TypoH1>
      <TypoP className="text-xl inline max-w-160 max-md:max-w-full">
        Our institute offers a wide range of services designed to support
        groundbreaking medical research. From innovative research services to
        comprehensive clinical trials and dedicated patient care, we are
        committed to improving health outcomes. Partner with us to explore the
        future of medicine.
      </TypoP>
    </div>

    <div className="flex flex-row flex-wrap gap-15 justify-center">
      <InfoCard
        Icon={BriefcaseMedical}
        title="Expert Research Services to Propel Medical Innovations and Discoveries"
        desc="Our research services are at the forefront of scientific advancement."
        to="/about/impact"
      />
      <InfoCard
        Icon={HeartPulse}
        title="Clinical Trials Designed for Safety, Efficacy, and Patient Engagement"
        desc="Join our clinical trials to contribute to vital medical research."
        LinkElem={
          <Linker to="/auth" className="flex flex-row gap-3 items-center font-semibold text-dark dark:text-cyan-400 hover:text-accent-foreground mt-auto">
            Sign Up <ChevronRight />
          </Linker>
        }
      />
      <InfoCard
        Icon={HeartHandshake}
        title="Compassionate Patient Care Focused on Individual Needs and Well-Being"
        desc="We prioritize patient care to ensure the best possible outcomes."
        LinkElem={
          <Linker to="/contact" className="flex flex-row gap-3 items-center font-semibold text-dark hover:text-accent-foreground dark:text-cyan-400 mt-auto">
            Contact <ChevronRight />
          </Linker>
        }
      />
    </div>
  </section>
);

import { Globe, TrendingUp, Users } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./ui/accordion";

const goals = [
  {
    icon: <Globe className="lucide h-5 w-5" />,
    title: "Expand Global Access",
    desc: "Increase accessibility of cutting-edge medical research to healthcare professionals in underserved regions through digital platforms and localized content.",
  },
  {
    icon: <TrendingUp className="lucide h-5 w-5" />,
    title: "Accelerate Innovation",
    desc: "Foster interdisciplinary collaboration to develop breakthrough medical technologies and treatment approaches that address critical healthcare challenges.",
  },
  {
    icon: <Users className="lucide h-5 w-5" />,
    title: "Empower Next Generation",
    desc: "Develop comprehensive educational programs and mentorship opportunities for emerging medical researchers and healthcare professionals.",
  },
];

const Sect3 = () => {
  return (
    <section className="container px-4 md:px-20 my-10 bg-white dark:bg-transparent mt-50 mx-auto">
      <div className="grid gap-12 lg:grid-cols-2 items-center">
        {/* Left Section */}
        <div className="max-md:order-2 order-1">
          <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 mb-4 text-blue-600 border-blue-200">
            Strategic Goals
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Shaping the Future of Healthcare
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Our roadmap for the next decade focuses on expanding access,
            accelerating innovation, and empowering the next generation of
            medical professionals.
          </p>

          <div className="space-y-6">
            {goals.map(({ icon, title, desc }, idx) => (
              <div key={idx} className="flex gap-4">
                <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30 h-fit text-blue-600 dark:text-blue-400">
                  {icon}
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">{title}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Section */}
        <div className="relative max-md:order-1 order-2">
          <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
          <img
            src="https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fas2.ftcdn.net%2Fjpg%2F08%2F26%2F83%2F53%2F1000_F_826835378_mmDvuteLJv4a2AR30uvvQnCYxkWDpZQU.jpg&f=1&nofb=1&ipt=7640cccb230d1f863d04193f76c3a46ca20b8c2c868b9bdec2fd282775016f2a"
            alt="Strategic Goals Visualization"
            className="rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 my-auto aspect-[11/9] object-cover mt-8"
          />
        </div>
      </div>
    </section>
  );
};

const FAQs = () => {
    const questions = [
        {q: "What is your mission?", a:"What is your mission? Our mission is to advance medical research and improve health outcomes. We strive to innovate through rigorous scientific inquiry. Our focus is on translating research into real-world solutions."},
        {q: "What research do you conduct?", a: "What research do you conduct?We conduct a wide range of research, including clinical trials and laboratory studies. Our projects span various medical fields, aiming to address critical health challenges. We collaborate with leading experts to ensure impactful outcomes."},
        {q: "How can I participate?", a: "Participation opportunities vary based on ongoing studies and trials. Interested individuals can visit our website for current openings. We welcome contributions from the community to enhance our research efforts."},
        {q: "What services do you offer?", a: "We offer a range of services, including patient consultations and educational resources. Our team provides support for those interested in understanding their health better. We aim to empower individuals through knowledge and research."},
        {q: "How to contact you?", a: "You can reach us via our contact page or by calling our office directly. We are here to assist you with any inquiries. Our team is dedicated to providing timely responses."},
    ]
    return (
      <div className="max-md:flex-wrap flex flex-row gap-15 px-10 md:px-20 mt-50 justify-center w-full bg-white dark:bg-transparent py-10">
        <div className="flex flex-col gap-8 min-w-[100px] items-start">
          <TypoH1 gradient={true} className="text-5xl">FAQs</TypoH1>
          <TypoP className="text-md max-w-120">
            Discover answers to your questions about our mission, research
            initiatives, and available services.
          </TypoP>
          <Linker to="/contact" className="cursor-pointer p-5 px-8 border-2 border-black text-dark hover:text-accent-foreground hover:border-accent-foreground dark:text-white dark:border-white dark:hover:text-cyan-400 dark:hover:border-cyan-400 font-semibold">
            Contact
          </Linker>
        </div>

        <Accordion type="single" collapsible className="m-0 p-0 grow w-full">
            {questions.map((qa, i) => {
                return (
                  <AccordionItem value={`item-${i + 1}`}>
                    <AccordionTrigger className="border-b-4 border-b-black dark:border-b-white text-xl text-[1.5rem] py-7">{qa.q}</AccordionTrigger>
                    <AccordionContent className="text-[1.2rem] py-7">{qa.a}</AccordionContent>
                  </AccordionItem>
                );
            })}
        </Accordion>
      </div>
    );
};


const SectF = () => (
  <div className="flex flex-row flex-wrap gap-15 justify-center items-center bg-white dark:bg-transparent px-10 w-full mt-50 py-10">
    <InfoCard
      Icon={Mail}
      title="Email"
      desc="For inquiries, please reach out to us directly via email."
      LinkElem={
        <Linker to="mailto:info@medarchive.com" className="underline mt-auto text-center">
          info@medarchive.com
        </Linker>
      }
    />
    <InfoCard
      Icon={Phone}
      title="Phone"
      desc="Call us for immediate assistance or questions regarding our research."
      LinkElem={
        <Linker to="tel:+1 (555) 123-4567" className="underline mt-auto text-center">
          +1 (555) 123-4567
        </Linker>
      }
    />
    <InfoCard
      Icon={MapPin}
      title="HeadQuarters"
      desc="Visit us at our main HQ for further information."
      LinkElem={
        <Linker to="" className="underline mt-auto text-center">
          456 Research Ave, Sydney NSW 2000 AU
        </Linker>
      }
    />
  </div>
);

export const Main = () => {
    return (
        <>
           <Sect1 /> 
           <Sect2 /> 
           <Sect3 /> 
           <FAQs /> 
           <SectF /> 
        </>
    )
}