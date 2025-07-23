import { useEffect, useState } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import logo from "../assets/audio-waveform.svg";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { ModeToggle } from "./mode-toggle";
import Avatar from "@mui/material/Avatar";
import GradientText from "./ui/gradient-text";
import { Footer } from "./footer";
import { Menu, ChevronDown } from "lucide-react";
import { useAuthStore } from "./context/authStore";
import { Button } from "./ui/button";

const components = [
  {
    title: "Alert Dialog",
    href: "/docs/primitives/alert-dialog",
    description: "A modal dialog that interrupts the user with important content and expects a response.",
  },
  {
    title: "Hover Card",
    href: "/docs/primitives/hover-card",
    description: "For sighted users to preview content available behind a link.",
  },
  {
    title: "Progress",
    href: "/docs/primitives/progress",
    description: "Displays an indicator showing the completion progress of a task, typically displayed as a progress bar.",
  },
  {
    title: "Scroll-area",
    href: "/docs/primitives/scroll-area",
    description: "Visually or semantically separates content.",
  },
  {
    title: "Tabs",
    href: "/docs/primitives/tabs",
    description: "A set of layered sections of content—known as tab panels—that are displayed one at a time.",
  },
  {
    title: "Tooltip",
    href: "/docs/primitives/tooltip",
    description: "A popup that displays information related to an element when the element receives keyboard focus or the mouse hovers over it.",
  },
];

const navLinks = [
  { label: "Home", path: "/" },
  { label: "Articles", path: "/articles" },
  { label: "Research", path: "/research" },
];

const Navbar = () => {
  const [show, setShow] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [resourcesOpen, setResourcesOpen] = useState(false);
  const user = useAuthStore((s) => s.user);
  const nav = useNavigate();

  useEffect(() => {
    const controlNavbar = () => {
      if (window.scrollY < 50) {
        setShow(true);
      } else if (window.scrollY > lastScrollY) {
        setShow(false);
      } else {
        setShow(true);
      }
      setLastScrollY(window.scrollY);
    };
    window.addEventListener("scroll", controlNavbar);
    return () => window.removeEventListener("scroll", controlNavbar);
  }, [lastScrollY]);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (mobileOpen && !event.target.closest('.mobile-menu-container')) {
        setMobileOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [mobileOpen]);

  // Close mobile menu on route change
  const handleLinkClick = () => {
    setMobileOpen(false);
    setResourcesOpen(false);
  };

  return (
    <div className="app-wrapper max-w-[1600px] m-auto w-full h-full">
      {/* Sticky Navbar */}
      <div className={`sticky top-0 z-50 transition-transform duration-300 ${show ? "translate-y-0" : "-translate-y-full"} bg-white/30 dark:bg-background/30 backdrop-blur-sm border-b border-border/20`}>
        <div className="px-4 py-4 max-w-[1600px] m-auto">
          <div className="flex items-center justify-between">
            {/* Left: Logo */}
            <Link to="/" className="flex items-center gap-2">
              <img src={logo} className="w-8" alt="MedArchive Logo" />
              <GradientText className="text-3xl font-bold max-md:text-xl">
                MedArchive
              </GradientText>
            </Link>

            {/* Middle: Desktop Navigation */}
            <NavigationMenu viewport={false} className="hidden lg:flex">
              <NavigationMenuList>
                {navLinks.map(({ label, path }) => (
                  <NavigationMenuItem key={label}>
                    <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                      <Link to={path}>{label}</Link>
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                ))}
                <NavigationMenuItem>
                  <NavigationMenuTrigger>Resources</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid w-[400px] gap-2 md:w-[500px] md:grid-cols-2 lg:w-[600px] p-4">
                      {components.map(({ title, href, description }) => (
                        <ListItem key={title} title={title} href={href}>
                          {description}
                        </ListItem>
                      ))}
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>

            {/* Right: Avatar, Dark Mode Toggle, Hamburger */}
            <div className="flex items-center gap-3">
              <ModeToggle />
              {user && <Link to="/dashboard">
                <Avatar
                  alt={user.name}
                  src={user.avatar}
                  className="border border-gray-500 dark:border-white w-5 h-5"
                  style={{ "height": "36px", "width": "36px" }}
                />
              </Link>}
              {!user &&
                <Button variant={"outline"} onClick={() => nav("/auth")}>Login</Button>
              }

              {/* Hamburger Menu Button */}
              <button
                className="lg:hidden p-2 rounded-md hover:bg-accent transition-colors mobile-menu-container"
                onClickCapture={() => setMobileOpen(prev => !prev)}
                aria-label="Toggle Mobile Menu"
                aria-expanded={mobileOpen}
              >
                <Menu className="w-8 h-8" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm mobile-menu-container min-h-max">
          <div className="fixed top-[73px] left-0 right-0 bg-background border-b border-border shadow-lg animate-in slide-in-from-top-2 duration-200">
            <div className="px-1 py-4 max-h-[calc(100vh-73px)] overflow-y-auto scrollbar-hidden">
              {/* Main Navigation Links */}
              <nav className="space-y-1">
                {navLinks.map(({ label, path }) => (
                  <Link
                    key={label}
                    to={path}
                    className="block px-3 py-4 text-base font-medium text-foreground hover:bg-accent hover:text-accent-foreground rounded-md transition-colors"
                    onClick={handleLinkClick}
                  >
                    {label}
                  </Link>
                ))}

                {/* Resources Dropdown */}
                <div className="space-y-1 min-h-max">
                  <button
                    className="flex items-center justify-between w-full px-3 py-4 text-base font-medium text-foreground hover:bg-accent hover:text-accent-foreground rounded-md transition-colors min-h-max"
                    onClick={() => setResourcesOpen(prev => !prev)}
                    aria-expanded={resourcesOpen}
                  >
                    Resources
                    <ChevronDown className={`w-4 h-4 transition-transform ${resourcesOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {resourcesOpen && (
                    <div className="pl-3 space-y-1 animate-in slide-in-from-top-1 duration-200">
                      {components.map(({ title, href, description }) => (
                        <Link
                          key={title}
                          to={href}
                          className="block px-3 py-4 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded-md transition-colors"
                          onClick={handleLinkClick}
                        >
                          <div className="font-medium">{title}</div>
                          {description && (
                            <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {description}
                            </div>
                          )}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </nav>
            </div>
          </div>
        </div>
      )}

      <div>
        <Outlet />
      </div>

      <Footer />
    </div>
  );
};

export default Navbar;

function ListItem({
  title,
  children,
  href,
  ...props
}: React.ComponentPropsWithoutRef<"li"> & { href: string }) {
  return (
    <li {...props}>
      <NavigationMenuLink asChild>
        <Link
          to={href}
          className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
        >
          <div className="text-sm font-medium leading-none">{title}</div>
          <p className="text-muted-foreground text-sm leading-snug line-clamp-2">
            {children}
          </p>
        </Link>
      </NavigationMenuLink>
    </li>
  );
}