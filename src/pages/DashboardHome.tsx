import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, BookOpen, ShieldAlert, Sparkles, AlertCircle } from "lucide-react";
import logo from "@/assets/saksham-logo.png";

type Announcement = {
  id: string;
  content: string;
  created_at: string;
  priority?: string | null;
};

export default function DashboardHome() {
  const { user } = useAuth();
  const [name, setName] = useState("Operator");
  const [role, setRole] = useState("operator");
  const [stats, setStats] = useState({ downline: 0, sadhnaToday: 0, pendingSeva: 0 });
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      // Get user profile
      const { data: prof } = await supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle();
      const userName = prof?.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || "Operator";
      setName(userName);

      const { data: roleData } = await supabase.from("user_roles").select("role").eq("user_id", user.id).maybeSingle();
      if (roleData?.role) setRole(roleData.role);

      // Fetch announcements
      const { data: ann } = await supabase.from("community_posts")
        .select("*")
        .eq("post_type", "announcement")
        .order("created_at", { ascending: false })
        .limit(5);
      if (ann) setAnnouncements(ann);

      // Fetch real pending seva count for the user's downline (or assigned to them)
      let query = supabase.from("seva_tasks").select("id", { count: "exact" }).eq("status", "pending");
      const isAdmin = roleData?.role === "admin";
      
      if (!isAdmin) {
        query = query.or(`assigned_to.eq.${user.id},assigned_by.eq.${user.id}`);
      }
      
      const { count: pendingCount } = await query;
      let downlineCount = 0;
      try {
        const { data: downlines } = await supabase.rpc("get_downline_ids", { _root: user.id });
        if (downlines) downlineCount = downlines.length;
      } catch (e) {
        // gracefully fallback if RPC doesn't exist
      }
      
      setStats({
        downline: downlineCount,
        sadhnaToday: 0, // Placeholder
        pendingSeva: pendingCount || 0,
      });
    })();
  }, [user]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <Card className="overflow-hidden border-primary/20 shadow-elegant">
        <div className="bg-gradient-divine p-6 md:p-8 text-primary-foreground relative">
          <div className="flex items-center gap-4">
            <img src={logo} alt="Saksham" className="h-20 w-20 rounded-full ring-4 ring-primary-glow/40" />
            <div>
              <p className="text-sm opacity-80">Hare Krishna 🙏</p>
              <h1 className="font-serif text-3xl md:text-4xl mt-1 text-secondary">Welcome, {name}</h1>
              <p className="mt-1 text-xs md:text-sm opacity-90 italic">"Aapka Saksham Path"</p>
              <p className="mt-1 text-[11px] md:text-xs opacity-80 uppercase tracking-wider">
                Role: {role}
              </p>
            </div>
          </div>
          <Sparkles className="absolute right-6 top-6 opacity-30 h-12 w-12" />
        </div>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="shadow-soft hover:shadow-elegant transition-shadow border-primary/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">My Downline</CardTitle>
            <Users className="h-5 w-5 text-primary/70" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-serif text-primary">{stats.downline}</div>
            <p className="text-xs text-muted-foreground mt-1">Total devotees under you</p>
          </CardContent>
        </Card>

        <Card className="shadow-soft hover:shadow-elegant transition-shadow border-primary/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Sadhna Today</CardTitle>
            <BookOpen className="h-5 w-5 text-primary/70" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-serif text-primary">{stats.sadhnaToday}</div>
            <p className="text-xs text-muted-foreground mt-1">Entries submitted today</p>
          </CardContent>
        </Card>

        <Card className="shadow-soft hover:shadow-elegant transition-shadow border-primary/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Seva</CardTitle>
            <ShieldAlert className="h-5 w-5 text-primary/70" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-serif text-primary">{stats.pendingSeva}</div>
            <p className="text-xs text-muted-foreground mt-1">Tasks pending completion</p>
          </CardContent>
        </Card>
      </div>

      <div className="pt-4">
        <h2 className="text-2xl font-serif text-primary flex items-center gap-2 mb-4">
          <AlertCircle className="h-6 w-6" /> Announcements
        </h2>
        <div className="space-y-4">
          {announcements.map((a) => (
            <Card key={a.id} className={`shadow-soft overflow-hidden ${a.priority === 'important' ? 'border-red-500/30' : 'border-primary/20'}`}>
              <div className={`p-1 ${a.priority === 'important' ? 'bg-red-500/20' : 'bg-primary/10'}`} />
              <CardHeader className="py-3">
                <CardTitle className="text-lg flex items-center gap-2 font-serif text-primary">
                  <AlertCircle className="h-4 w-4 text-primary" />
                  Announcement
                </CardTitle>
              </CardHeader>
              <CardContent className="py-3 pt-0">
                <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{a.content}</p>
                <div className="mt-3 text-[11px] text-muted-foreground uppercase tracking-wider">
                  Posted: {new Date(a.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </div>
              </CardContent>
            </Card>
          ))}
          {announcements.length === 0 && (
            <div className="text-center p-8 bg-muted/30 rounded-xl border border-dashed border-border">
              <p className="text-muted-foreground text-sm">No recent announcements.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
