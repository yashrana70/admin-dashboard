import { NavLink, useLocation } from "react-router-dom";
import { Home, User, Users, BookOpenCheck, BarChart3, Calendar, CalendarDays, LogOut, Shield, ListChecks, Trophy, Network, BookOpen, Settings2, Sun, Moon, Heart } from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import logo from "@/assets/saksham-logo.png";
import { useAuth } from "@/lib/auth";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";

const items = [
  { key: "Dashboard", url: "/", icon: Home },
  { key: "All Devotees", url: "/users", icon: Users },
  { key: "Sadhna Entries", url: "/sadhna", icon: BookOpenCheck },
  { key: "Attendance", url: "/attendance", icon: ListChecks },
  { key: "Seva Data", url: "/seva", icon: Shield },
  { key: "Events", url: "/events", icon: CalendarDays },
  { key: "Leaderboard", url: "/leaderboard", icon: Trophy },
  { key: "Announcements", url: "/announcements", icon: BookOpen },
  { key: "Donations & Purchases", url: "/donations", icon: Heart },
  { key: "Admin Panel", url: "/admin", icon: Settings2 },
  { key: "My Profile", url: "/profile", icon: User },
];

export function AppSidebar() {
  const { state, isMobile, setOpenMobile } = useSidebar();
  const collapsed = state === "collapsed";
  const { pathname } = useLocation();
  const { signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const { isAdmin } = useIsAdmin();
  const { t } = useI18n();
  const handleNav = () => { if (isMobile) setOpenMobile(false); };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-3 p-2">
          <img src={logo} alt="Saksham logo" className="h-10 w-10 rounded-full ring-2 ring-primary/40 object-cover" />
          {!collapsed && (
            <div className="leading-tight">
              <div className="font-serif text-lg font-bold text-sidebar-foreground">{t("app_name")}</div>
              <div className="text-[10px] italic tracking-wide text-sidebar-foreground/70">"{t("app_tagline")}"</div>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Devotee Path</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={pathname === item.url}>
                    <NavLink to={item.url} end onClick={handleNav} className="flex items-center gap-3">
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{t(item.key)}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              {isAdmin && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname === "/admin"}>
                    <NavLink to="/admin" end onClick={handleNav} className="flex items-center gap-3">
                      <Settings2 className="h-4 w-4" />
                      {!collapsed && <span>Admin Panel</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-2 space-y-2">
        <Button variant="ghost" size="sm" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="text-sidebar-foreground hover:bg-sidebar-accent justify-start gap-2 w-full">
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          {!collapsed && (theme === "dark" ? "Light Mode" : "Dark Mode")}
        </Button>
        <Button variant="ghost" size="sm" onClick={signOut}
          className="text-sidebar-foreground hover:bg-sidebar-accent justify-start gap-2 w-full">
          <LogOut className="h-4 w-4" />
          {!collapsed && t("sign_out")}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
