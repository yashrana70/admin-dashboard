import { useEffect, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Home, Users, BookOpenCheck, ShieldAlert, Award, Calendar, LogOut, Menu, X, Sun, Moon, Database, CheckSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import logo from "@/assets/saksham-logo.png";

const NAV_ITEMS = [
  { label: "Dashboard", path: "/", icon: <Home className="h-4 w-4" /> },
  { label: "Profiles & Hierarchy", path: "/profile", icon: <Users className="h-4 w-4" /> },
  { label: "All Users Database", path: "/users", icon: <Database className="h-4 w-4" /> },
  { label: "Attendance", path: "/attendance", icon: <CheckSquare className="h-4 w-4" /> },
  { label: "Sadhna Reports", path: "/sadhna", icon: <BookOpenCheck className="h-4 w-4" /> },
  { label: "Seva Tasks", path: "/seva", icon: <ShieldAlert className="h-4 w-4" /> },
  { label: "Leaderboard", path: "/leaderboard", icon: <Award className="h-4 w-4" /> },
  { label: "Events", path: "/events", icon: <Calendar className="h-4 w-4" /> },
];

export default function AppLayout() {
  const { signOut, user } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const [role, setRole] = useState("Loading...");

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (user) {
      supabase.from("user_roles").select("role").eq("user_id", user.id).maybeSingle().then(({ data }) => {
        if (data) setRole(data.role.toUpperCase());
      });
    }
  }, [user]);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("Signed out successfully");
    } catch (err: any) {
      toast.error("Failed to sign out");
    }
  };

  return (
    <div className="flex h-screen bg-background flex-col md:flex-row overflow-hidden">
      {/* Mobile Navbar */}
      <div className="md:hidden flex items-center justify-between p-4 border-b bg-card text-card-foreground">
        <div className="flex items-center gap-2">
          <img src={logo} alt="Saksham" className="h-8 w-8 rounded-full" />
          <span className="font-serif font-bold text-lg text-primary">Dashboard</span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`${
          isMobileMenuOpen ? "flex" : "hidden"
        } md:flex flex-col w-full md:w-64 border-r bg-card h-[calc(100vh-65px)] md:h-screen absolute md:static top-[65px] left-0 z-40`}
      >
        <div className="hidden md:flex p-6 items-center gap-3 border-b border-border/50">
          <img src={logo} alt="Saksham" className="h-10 w-10 rounded-full ring-2 ring-primary/20" />
          <div className="flex flex-col">
            <span className="font-serif font-bold text-lg leading-tight text-primary">Saksham Admin</span>
            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{role}</span>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
          {NAV_ITEMS.map((item) => (
            <Link key={item.path} to={item.path}>
              <Button
                variant={location.pathname === item.path ? "secondary" : "ghost"}
                className={`w-full justify-start gap-3 h-11 ${
                  location.pathname === item.path ? "bg-primary/10 text-primary hover:bg-primary/15 font-medium" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {item.icon}
                {item.label}
              </Button>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-border/50 space-y-2">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-muted-foreground h-10"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            {theme === "dark" ? "Light Mode" : "Dark Mode"}
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 h-10"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-background relative">
        <div className="flex-1 overflow-y-auto">
          <div className="container max-w-6xl p-4 md:p-8 mx-auto pb-24">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
