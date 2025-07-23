import { DashboardSidebar } from "./dashboard-sidebar";
import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "./ui/sidebar";

const DashboardLayout = () => {
  return (
    <SidebarProvider>
      <DashboardSidebar />
      <main className="ms-10">
        <SidebarTrigger />
        <Outlet />
      </main>
    </SidebarProvider>
  );
};
export default DashboardLayout;
