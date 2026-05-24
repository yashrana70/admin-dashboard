import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Medal, Award } from "lucide-react";

type Row = { user_id: string; name: string; tasks_completed: number; score: number };

export default function Leaderboard() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      // Fetch completed seva tasks and profiles to compute Leaderboard
      const [{ data: tasks }, { data: profiles }] = await Promise.all([
        supabase.from("seva_tasks").select("assigned_to").eq("status", "completed"),
        supabase.from("profiles").select("id, full_name, email")
      ]);

      const counts: Record<string, number> = {};
      tasks?.forEach((t: any) => {
        counts[t.assigned_to] = (counts[t.assigned_to] || 0) + 1;
      });

      const arr: Row[] = profiles?.map(p => ({
        user_id: p.id,
        name: p.full_name || p.email || "Devotee",
        tasks_completed: counts[p.id] || 0,
        score: (counts[p.id] || 0) * 10 // 10 points per task
      })).filter(r => r.tasks_completed > 0)
      .sort((a, b) => b.score - a.score).slice(0, 50) || [];

      setRows(arr);
      setLoading(false);
    })();
  }, []);

  const rankIcon = (i: number) => {
    if (i === 0) return <Trophy className="h-6 w-6 text-yellow-500" />;
    if (i === 1) return <Medal className="h-6 w-6 text-slate-400" />;
    if (i === 2) return <Award className="h-6 w-6 text-amber-700" />;
    return <span className="text-sm font-semibold text-muted-foreground w-6 text-center">{i + 1}</span>;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="font-serif text-3xl">🏆 Seva Leaderboard</h1>
        <p className="text-muted-foreground text-sm">Ranking Operators and Volunteers by assigned tasks completed</p>
      </div>

      <Card className="border-primary/20">
        <CardHeader className="pb-3"><CardTitle className="font-serif text-lg">📋 How Ranking Works</CardTitle></CardHeader>
        <CardContent className="text-sm space-y-2">
          <p><span className="font-semibold text-primary">⚡ Qualification:</span> You must complete tasks delegated to you by an Admin or Operator.</p>
          <p><span className="font-semibold">Points:</span> Every completed task grants <span className="text-primary font-bold">10 points</span>.</p>
          <p className="text-muted-foreground text-xs">
            Show dedication to your assigned Seva to climb the ranks and inspire others!
          </p>
        </CardContent>
      </Card>

      <Card className="shadow-elegant">
        <CardHeader>
          <CardTitle className="font-serif">Top Servers</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {loading && <div className="text-muted-foreground py-6 text-center">Loading rankings…</div>}
          {!loading && rows.length === 0 && (
            <div className="text-muted-foreground py-6 text-center">No tasks completed yet — assign some Seva!</div>
          )}
          {rows.map((d, i) => (
            <div
              key={d.user_id}
              className={`flex items-center gap-3 p-3 rounded-lg border ${
                i === 0 ? "bg-yellow-500/10 border-yellow-500/40" :
                i === 1 ? "bg-slate-400/10 border-slate-400/30" :
                i === 2 ? "bg-amber-700/10 border-amber-700/30" :
                "bg-muted/30"
              }`}
            >
              <div className="w-8 grid place-items-center">{rankIcon(i)}</div>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{d.name}</div>
                <div className="text-xs text-muted-foreground">
                  {i === 0 ? "🥇 1st Rank" : i === 1 ? "🥈 2nd Rank" : i === 2 ? "🥉 3rd Rank" : `Rank #${i + 1}`}
                  {" • "}{d.tasks_completed} task{d.tasks_completed === 1 ? "" : "s"} completed
                </div>
              </div>
              <div className="text-right">
                <div className="text-xl font-serif text-primary">{d.score} <span className="text-sm">pts</span></div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
