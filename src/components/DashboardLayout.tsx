import { ReactNode } from "react";
import { DashboardSidebar } from "./DashboardSidebar";
import { DashboardHeader } from "./DashboardHeader";
import { SidebarProvider, SidebarTrigger } from "./ui/sidebar";
import { MobileBottomNav } from "./MobileBottomNav";

interface DashboardLayoutProps {
  children: ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-gradient-to-br from-black via-zinc-900 to-zinc-800">
        <DashboardSidebar />
        
        <main className="flex-1 min-w-0">
          <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-zinc-800 bg-zinc-900/80 backdrop-blur-xl px-4 h-16">
            <SidebarTrigger className="text-zinc-400 hover:text-white md:flex hidden" />
            <div className="flex-1">
              <DashboardHeader />
            </div>
          </div>
          
          <div className="pb-20 md:pb-0">
            {children}
          </div>

          <footer className="border-t border-zinc-800 mt-12 py-4 hidden md:block">
            <div className="px-4 md:px-6 lg:px-8">
              <p className="text-center text-xs text-zinc-500">
                Built with <span className="text-primary">Lovable</span>
              </p>
            </div>
          </footer>
        </main>
        
        <MobileBottomNav />
      </div>
    </SidebarProvider>
  );
};
