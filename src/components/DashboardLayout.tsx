import { ReactNode } from "react";
import { DashboardSidebar } from "./DashboardSidebar";
import { DashboardHeader } from "./DashboardHeader";
import { SidebarProvider, SidebarTrigger } from "./ui/sidebar";

interface DashboardLayoutProps {
  children: ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <DashboardSidebar />
        
        <main className="flex-1 min-w-0">
          <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-border bg-card/80 backdrop-blur-xl px-4 h-16">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground md:flex hidden" />
            <div className="flex-1">
              <DashboardHeader />
            </div>
          </div>
          
          <div className="pb-44 md:pb-0">
            {children}
          </div>

          <footer className="border-t border-border mt-12 py-4 hidden md:block">
            <div className="px-4 md:px-6 lg:px-8">
              <p className="text-center text-xs text-muted-foreground">
                Built with <span className="text-primary">Lovable</span>
              </p>
            </div>
          </footer>
        </main>
      </div>
    </SidebarProvider>
  );
};
