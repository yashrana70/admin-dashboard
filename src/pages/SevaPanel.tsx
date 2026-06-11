import { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus, CheckCircle2, Circle, Clock } from "lucide-react";
import { toast } from "sonner";
import { differenceInDays, parseISO } from "date-fns";
import { useIsAdmin } from "@/hooks/useIsAdmin";

type SevaTask = {
  id: string;
  title: string;
  description?: string | null;
  assigned_to: string;
  assigned_by: string;
  due_date?: string | null;
  status: string;
  created_at: string;
  completed_at?: string | null;
};

type DevoteeProfile = {
  id: string;
  full_name?: string | null;
  email?: string | null;
};

export default function SevaPanel() {
  const { user } = useAuth();
  const { isAdmin, isStaff } = useIsAdmin();
  const [tasks, setTasks] = useState<SevaTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Create Task Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [dueDate, setDueDate] = useState("");
  
  const [downline, setDownline] = useState<DevoteeProfile[]>([]);
  const [profilesMap, setProfilesMap] = useState<Record<string, string>>({});

  const loadData = useCallback(async () => {
    if (!user || !isStaff) return;
    setLoading(true);
    try {
      // Load all profiles to map IDs to Names
      const { data: allProfiles } = await supabase.from("profiles").select("id, full_name, email");
      const pMap: Record<string, string> = {};
      allProfiles?.forEach(p => { pMap[p.id] = p.full_name || p.email || "Unknown User"; });
      setProfilesMap(pMap);

      let allowedTaskIds: string[] = [];

      // Load Downline for assignment dropdown
      if (isAdmin) {
        setDownline(allProfiles || []);
      } else {
        const { data: dl, error: rpcError } = await supabase.rpc("get_downline_ids", { _root: user.id });
        if (rpcError) throw rpcError;
        
        if (dl) {
          const dlIds = dl.map((d: any) => d.user_id);
          allowedTaskIds = [...dlIds, user.id]; // including self
          const dlProfiles = allProfiles?.filter(p => dlIds.includes(p.id)) || [];
          setDownline(dlProfiles);
        }
      }

      let query = supabase.from("seva_tasks").select("*").order("created_at", { ascending: false });
      
      if (!isAdmin) {
        // Operator/Volunteer sees tasks assigned TO them, or BY them, or assigned TO their downline
        if (allowedTaskIds.length > 0) {
          query = query.or(`assigned_to.in.(${allowedTaskIds.join(',')}),assigned_by.eq.${user.id}`);
        } else {
          query = query.or(`assigned_to.eq.${user.id},assigned_by.eq.${user.id}`);
        }
      }
      
      const { data: tasksData, error: taskError } = await query;
      if (taskError) throw taskError;
      if (tasksData) setTasks(tasksData);

    } catch (err: unknown) {
      toast.error(err.message || "Failed to load Seva tasks");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [isAdmin, isStaff, user]);

  useEffect(() => {
    if (user && isStaff) {
      loadData();
    }
  }, [user, isStaff, loadData]);

  const handleCreateTask = async () => {
    if (!title || !assignedTo) {
      toast.error("Title and Assignee are required.");
      return;
    }
    
    try {
      const { error } = await supabase.from("seva_tasks").insert({
        title,
        description,
        assigned_to: assignedTo,
        assigned_by: user!.id,
        due_date: dueDate || null,
        status: "pending"
      });
      
      if (error) throw error;
      toast.success("Task assigned successfully!");
      setIsDialogOpen(false);
      setTitle("");
      setDescription("");
      setAssignedTo("");
      setDueDate("");
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to create task");
    }
  };

  const handleMarkComplete = async (taskId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === "completed" ? "pending" : "completed";
      const { error } = await supabase.from("seva_tasks").update({
        status: newStatus,
        completed_at: newStatus === "completed" ? new Date().toISOString() : null
      }).eq("id", taskId);
      
      if (error) throw error;
      toast.success("Task updated!");
      loadData();
    } catch (err: any) {
      toast.error("Failed to update task");
    }
  };

  const renderAnalytics = () => {
    if (!isAdmin) return null;
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === "completed").length;
    const pending = total - completed;
    let totalDays = 0;
    tasks.filter(t => t.status === "completed").forEach(t => {
      totalDays += differenceInDays(new Date(t.completed_at || t.created_at), new Date(t.created_at)) || 0;
    });
    const avgDays = completed ? Math.round(totalDays / completed) : 0;

    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="shadow-soft"><CardContent className="p-4"><div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Tasks</div><div className="text-2xl font-serif text-primary mt-1">{total}</div></CardContent></Card>
        <Card className="shadow-soft"><CardContent className="p-4"><div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pending Seva</div><div className="text-2xl font-serif text-amber-600 mt-1">{pending}</div></CardContent></Card>
        <Card className="shadow-soft"><CardContent className="p-4"><div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Completed</div><div className="text-2xl font-serif text-emerald-600 mt-1">{completed}</div></CardContent></Card>
        <Card className="shadow-soft"><CardContent className="p-4"><div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Avg Completion Time</div><div className="text-2xl font-serif text-primary mt-1">{avgDays} <span className="text-sm font-sans font-normal text-muted-foreground">days</span></div></CardContent></Card>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif text-primary">Seva Tracking</h1>
          <p className="text-muted-foreground mt-1">Assign tasks and track completion metrics.</p>
        </div>
        {isStaff && (
          <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Delegate Task
          </Button>
        )}
      </div>

      {renderAnalytics()}
      
      <Card className="shadow-elegant border-primary/10">
        <CardHeader className="bg-primary/5 rounded-t-xl border-b border-primary/10">
          <CardTitle className="font-serif">All Tasks</CardTitle>
          <CardDescription>Monitor assigned tasks and how many days they take.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Task Title</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Delegated By</TableHead>
                  <TableHead>Time Taken</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.map((t) => {
                  let days = 0;
                  if (t.status === "completed") {
                    days = differenceInDays(new Date(t.completed_at || t.created_at), new Date(t.created_at));
                  } else {
                    days = differenceInDays(new Date(), new Date(t.created_at));
                  }
                  
                  return (
                    <TableRow key={t.id} className={t.status === "completed" ? "opacity-60 bg-muted/30" : ""}>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => handleMarkComplete(t.id, t.status)}
                          className={t.status === "completed" ? "text-emerald-600" : "text-muted-foreground"}>
                          {t.status === "completed" ? <CheckCircle2 className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
                        </Button>
                      </TableCell>
                      <TableCell>
                        <div className={`font-medium ${t.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>{t.title}</div>
                        {t.description && <div className="text-xs text-muted-foreground mt-1">{t.description}</div>}
                      </TableCell>
                      <TableCell>
                        {t.assigned_to === user?.id ? (
                          <span className="bg-primary/10 text-primary px-2 py-1 rounded text-xs font-semibold">Me</span>
                        ) : (
                          profilesMap[t.assigned_to] || "Unknown"
                        )}
                      </TableCell>
                      <TableCell>
                        {t.assigned_by === user?.id ? "Me" : profilesMap[t.assigned_by] || "Unknown"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-xs font-medium">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          {days === 0 ? "Today" : `${days} day${days === 1 ? '' : 's'}`}
                        </div>
                        {t.due_date && <div className="text-[10px] text-muted-foreground mt-0.5">Due: {new Date(t.due_date).toLocaleDateString()}</div>}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {tasks.length === 0 && (
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No tasks found.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delegate Seva Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Task Title</Label>
              <Input placeholder="e.g. Call devotees for Sunday Feast" value={title} onChange={e => setTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Description (Optional)</Label>
              <Textarea placeholder="Details about the task..." value={description} onChange={e => setDescription(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Assign To (Downline)</Label>
              <Select value={assignedTo} onValueChange={setAssignedTo}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a devotee" />
                </SelectTrigger>
                <SelectContent>
                  {downline.filter(d => d.id !== user?.id).map(d => (
                    <SelectItem key={d.id} value={d.id}>{d.full_name || d.email}</SelectItem>
                  ))}
                  {downline.filter(d => d.id !== user?.id).length === 0 && (
                    <SelectItem value="none" disabled>No downline members found</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Due Date (Optional)</Label>
              <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateTask}>Assign Task</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
