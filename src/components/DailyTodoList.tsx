import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, ListChecks } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

type Todo = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  completed: boolean;
  completed_at: string | null;
};

export default function DailyTodoList() {
  const { user } = useAuth();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [rungAlarms, setRungAlarms] = useState<Set<string>>(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem("spark_rung_alarms") || "[]"));
    } catch {
      return new Set();
    }
  });

  const load = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("todo_items")
      .select("*")
      .eq("user_id", user.id)
      .order("completed", { ascending: true })
      .order("due_date", { ascending: true })
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setTodos((data as Todo[]) || []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    load();
  }, [load]);

  // Alarm checker
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      todos.forEach(t => {
        if (!t.completed && t.due_date) {
          const due = new Date(t.due_date);
          const diffSeconds = (now.getTime() - due.getTime()) / 1000;
          const alarmKey = `${t.id}-${due.getTime()}`;
          
          if (diffSeconds >= 0 && !rungAlarms.has(alarmKey)) {
            setRungAlarms(prev => {
              const newSet = new Set(prev).add(alarmKey);
              localStorage.setItem("spark_rung_alarms", JSON.stringify(Array.from(newSet)));
              return newSet;
            });
            toast(t.title, { description: "Time to complete your task! 🪔", duration: 10000 });
            try {
              const audio = new Audio("/hare_krishna.mp3");
              audio.play().catch(e => console.log("Audio play blocked", e));
            } catch (error) {
              console.warn("Audio playback error", error);
            }
          }
        }
      });
    }, 2000);
    return () => clearInterval(interval);
  }, [todos, rungAlarms]);

  const addTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!title.trim()) { toast.error("Enter a task"); return; }
    setAdding(true);
    const { error } = await supabase.from("todo_items").insert({
      user_id: user.id,
      title: title.trim(),
      due_date: dueDate ? new Date(dueDate).toISOString() : null,
    });
    setAdding(false);
    if (error) { toast.error(error.message); return; }
    setTitle("");
    toast.success("Task added 🪔");
    load();
  };

  const toggle = async (t: Todo) => {
    const next = !t.completed;
    const { error } = await supabase
      .from("todo_items")
      .update({ completed: next, completed_at: next ? new Date().toISOString() : null })
      .eq("id", t.id);
    if (error) { toast.error(error.message); return; }
    load();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("todo_items").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    load();
  };

  const pending = todos.filter(t => !t.completed).length;

  return (
    <Card className="shadow-elegant">
      <CardHeader>
        <CardTitle className="font-serif flex items-center gap-2">
          <ListChecks className="h-5 w-5 text-primary" /> My Daily Routine
          <span className="ml-auto text-xs text-muted-foreground font-normal">
            {pending} pending · {todos.length} total
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={addTodo} className="flex gap-2 flex-wrap">
          <Input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g. Mangala Aarti, 16 rounds, read SB…"
            className="flex-1 min-w-[180px]"
          />
          <Input
            type="datetime-local"
            value={dueDate}
            onChange={e => setDueDate(e.target.value)}
            className="w-auto"
          />
          <Button type="submit" disabled={adding} className="btn-liquid-glass gap-1">
            <Plus className="h-4 w-4" /> Add
          </Button>
        </form>

        {loading ? (
          <p className="text-sm text-muted-foreground text-center py-4">Loading…</p>
        ) : todos.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            No tasks yet — add your first daily routine 🌅
          </p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {todos.map(t => (
              <div
                key={t.id}
                className={`flex items-center gap-3 p-3 rounded-lg border bg-card/50 transition-colors ${
                  t.completed ? "opacity-60" : ""
                }`}
              >
                <Checkbox checked={t.completed} onCheckedChange={() => toggle(t)} />
                <div className="flex-1 min-w-0">
                  <div className={`font-medium truncate ${t.completed ? "line-through" : ""}`}>
                    {t.title}
                  </div>
                  {t.due_date && (
                    <div className="text-[11px] text-muted-foreground">
                      {format(new Date(t.due_date), "EEE, dd MMM yyyy hh:mm a")}
                    </div>
                  )}
                </div>
                <Button size="icon" variant="ghost" onClick={() => remove(t.id)} aria-label="Delete">
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
