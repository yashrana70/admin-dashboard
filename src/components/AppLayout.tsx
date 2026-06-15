import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import LanguageSwitcher from "./LanguageSwitcher";
import { useI18n } from "@/lib/i18n";

export default function AppLayout() {
  const { t } = useI18n();
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-background to-secondary/10">
        <AppSidebar />
        <div className="flex-1 flex flex-col w-full overflow-hidden">
          <header className="h-14 flex items-center border-b bg-card/60 backdrop-blur px-3 sticky top-0 z-30">
            <SidebarTrigger />
            <div className="ml-3 flex flex-col leading-tight">
              <span className="font-serif text-base md:text-lg text-primary font-bold">Admin Dashboard</span>
              <span className="text-[10px] italic text-muted-foreground uppercase tracking-widest">Saksham Sadhu Sang</span>
            </div>
            <div className="ml-auto"><LanguageSwitcher compact /></div>
          </header>
          <main className="flex-1 p-4 md:p-8 w-full mx-auto overflow-y-auto relative">
            <Outlet />
            <a 
              href="https://sakshamsadhusangapp.vercel.app" 
              className="md:hidden fixed bottom-6 right-6 z-50 flex items-center justify-center bg-purple-600 hover:bg-purple-700 text-white rounded-full p-4 shadow-xl transition-transform hover:scale-105"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            </a>
          </main>
          <footer className="border-t bg-card/40 backdrop-blur px-4 py-3 text-center text-[11px] text-muted-foreground space-y-0.5">
            <div>🌿 Inspired by the teachings of His Divine Grace A.C. Bhaktivedanta Swami Srila Prabhupada</div>
            <div className="font-medium text-secondary/80">🏛️ A Devotional Initiative under ISKCON Ayodhya</div>
          </footer>
        </div>
      </div>
    </SidebarProvider>
  );
}
