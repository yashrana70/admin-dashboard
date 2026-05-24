import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, BookOpen, Clock, ShieldAlert } from "lucide-react";

export default function DashboardHome() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ downline: 0, sadhnaToday: 0, pendingSeva: 0 });
  const [announcements, setAnnouncements] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      // Fetch announcements
      const { data: ann } = await supabase.from("announcements")
        .select("*")
        .order("created_at", { ascending: false });
      if (ann) setAnnouncements(ann);

      // Fetch real pending seva count for the user's downline (or assigned to them)
      let query = supabase.from("seva_tasks").select("id", { count: "exact" }).eq("status", "pending");
      let isAdmin = user.email === "sonuranaas56@gmail.com";
      const { data: roleData } = await supabase.from("user_roles").select("role").eq("user_id", user.id).maybeSingle();
      if (roleData?.role === "admin") isAdmin = true;
      
      if (!isAdmin) {
        query = query.or(`assigned_to.eq.${user.id},assigned_by.eq.${user.id}`);
      }
      
      const { count: pendingCount } = await query;

      const { data: downlines } = await supabase.rpc("get_downline_ids", { _root: user.id });
      
      setStats({
        downline: downlines?.length || 0,
        sadhnaToday: 0, // Placeholder
        pendingSeva: pendingCount || 0,
      });
    })();
  }, [user]);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-serif text-primary">Overview</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Downline</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.downline}</div>
            <p className="text-xs text-muted-foreground">Total devotees under you</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sadhna Today</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.sadhnaToday}</div>
            <p className="text-xs text-muted-foreground">Entries submitted today</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Seva</CardTitle>
            <ShieldAlert className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingSeva}</div>
            <p className="text-xs text-muted-foreground">Tasks pending completion</p>
          </CardContent>
        </Card>
      </div>

      <h2 className="text-2xl font-serif mt-8 text-primary">Announcements</h2>
      <div className="space-y-4">
        {announcements.map((a) => (
          <Card key={a.id} className={a.priority === 'important' ? 'border-red-500/50 bg-red-500/5' : ''}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                {a.priority === 'important' && <ShieldAlert className="h-5 w-5 text-red-500" />}
                {a.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground/80">{a.message}</p>
              <p className="text-xs text-muted-foreground mt-2">
                Posted: {new Date(a.created_at).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>
        ))}
        {announcements.length === 0 && (
          <p className="text-muted-foreground text-sm">No recent announcements.</p>
        )}
      </div>
    </div>
  );
}
