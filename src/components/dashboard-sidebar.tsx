import {
  BarChartHorizontalBig,
  Bookmark,
  Home,
  LayoutDashboard,
  LogOut,
  PenBox,
  Settings,
  Shield,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "./ui/sidebar";
import { Link } from "react-router-dom";
import logo from "../assets/audio-waveform.svg";
import { TypoH1 } from "./ui/ctxt";
import { Separator } from "./ui/separator";
import { useAuthStore } from "./context/authStore";

const items = [
  {
    title: "Home",
    url: "/",
    icon: Home,
  },
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Bookmarks",
    url: "/dashboard/bookmarks",
    icon: Bookmark,
  },
  {
    title: "Articles",
    url: "/dashboard/articles",
    icon: BarChartHorizontalBig,
  },
  {
    title: "Write",
    url: "/dashboard/write",
    icon: PenBox,
    for: "researcher",
  },
  {
    title: "Admin Panel",
    url: "/dashboard/admin",
    icon: Shield,
    for: "admin",
  },
  {
    title: "Settings",
    url: "/dashboard/settings",
    icon: Settings,
  },
];


export function DashboardSidebar () {
  const user = useAuthStore((s) => s.user);
  
  return (
    <Sidebar
      collapsible="icon"
      className="group-data-[collapsible=icon]:w-18 justify-center"
    >
      <SidebarContent className="bg-card">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  className="data-[slot=sidebar-menu-button]:!p-1.5 group-data-[collapsible=icon]:hidden"
                >
                  <Link to="/" className="h-15 mb-4">
                    <img src={logo} className="size-5" />
                    <span className="text-base font-semibold my-10">
                      <TypoH1 gradient={true} className="text-xl py-10">
                        MedArchive
                      </TypoH1>
                    </span>
                  </Link>
                </SidebarMenuButton>
                <Link to="/" className="py-4 mb-4 w-full flex flex-row justify-center group-data-[state=expanded]:hidden">
                  <img src={logo} className="size-8" />
                </Link>
                <Separator className="mb-4" />
              </SidebarMenuItem>
              {items.map((item) => (
                <SidebarMenuItem
                  key={item.title}
                  className="group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:flex-row group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:pe-2 hover:bg-accent"
                >
                  <SidebarMenuButton asChild>
                    <Link to={item.url} className="py-5">
                      <item.icon
                        style={{ width: "1.3rem", height: "1.3rem" }}
                      />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="bg-card">
        <SidebarMenuItem className="list-none w-full">
          <div className="flex flex-row gap-2 max-w-full mb-5 items-end h-12 w-15">
            <img
              src={user?.avatar}
              alt=""
              className="h-full rounded-md group-data-[collapsible=icon]:hidden"
            />
            <div className="flex flex-col gap-0 p-0 m-0">
              <h1 className="font-medium text-[1rem] p-0 m-0 group-data-[collapsible=icon]:hidden">
                {user?.name ? user.name : user?.username}
              </h1>
              <span className="text-gray-400 text-[0.8rem] p-0 mt-[-0.3rem] group-data-[collapsible=icon]:hidden">
                {user?.email}
              </span>
            </div>
            <button className="ms-auto px-2 text-cyan-600 cursor-pointer h-full group-data-[collapsible=icon]:mx-0">
              <LogOut className="h-5" />
            </button>
          </div>
        </SidebarMenuItem>
      </SidebarFooter>
    </Sidebar>
  );
};
