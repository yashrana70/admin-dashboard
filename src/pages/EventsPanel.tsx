import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/lib/auth";
import { Plus, Pencil, Trash2, CalendarDays } from "lucide-react";
import { toast } from "sonner";

type VaishnavEvent = {
  id: string;
  title: string;
  event_date: string;
  event_type: string | null;
  description: string | null;
};

export default function EventsPanel() {
  const { user } = useAuth();
  const [events, setEvents] = useState<VaishnavEvent[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Form
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventType, setEventType] = useState("Festival");
  const [description, setDescription] = useState("");

  const loadEvents = async () => {
    const { data } = await supabase.from<VaishnavEvent>("vaishnav_events")
      .select("*")
      .order("event_date", { ascending: true });
    if (data) setEvents(data);
  };

  useEffect(() => {
    if (user?.email === "sonuranaas56@gmail.com") setIsAdmin(true);
    else {
      supabase.from<{ role: string }>("user_roles").select("role").eq("user_id", user?.id || "").maybeSingle().then(({ data }) => {
        if (data?.role === "admin") setIsAdmin(true);
      });
    }
    loadEvents();
  }, [user]);

  const openNew = () => {
    setEditingId(null);
    setTitle("");
    setEventDate("");
    setEventType("Festival");
    setDescription("");
    setIsDialogOpen(true);
  };

  const openEdit = (e: VaishnavEvent) => {
    setEditingId(e.id);
    setTitle(e.title);
    setEventDate(e.event_date);
    setEventType(e.event_type || "Festival");
    setDescription(e.description || "");
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!title || !eventDate) return toast.error("Title and Date are required");
    try {
      const payload = { title, event_date: eventDate, event_type: eventType, description };
      if (editingId) {
        await supabase.from("vaishnav_events").update(payload).eq("id", editingId);
        toast.success("Event updated");
      } else {
        await supabase.from("vaishnav_events").insert(payload);
        toast.success("Event created");
      }
      setIsDialogOpen(false);
      loadEvents();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to save event";
      toast.error(message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this event?")) return;
    try {
      await supabase.from("vaishnav_events").delete().eq("id", id);
      toast.success("Event deleted");
      loadEvents();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to delete event";
      toast.error(message);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif text-primary">Events Management</h1>
          <p className="text-muted-foreground mt-1">Manage Vaishnava calendar events globally.</p>
        </div>
        {isAdmin && (
          <Button onClick={openNew} className="gap-2">
            <Plus className="h-4 w-4" /> Add Event
          </Button>
        )}
      </div>
      
      <Card className="shadow-elegant border-primary/10">
        <CardHeader className="bg-primary/5 rounded-t-xl border-b border-primary/10">
          <CardTitle className="font-serif flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" /> Upcoming Events
          </CardTitle>
          <CardDescription>These events will be visible to all devotees in App 1.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Event Title</TableHead>
                <TableHead>Type</TableHead>
                {isAdmin && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="font-semibold">{new Date(e.event_date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="font-medium text-primary">{e.title}</div>
                    {e.description && <div className="text-xs text-muted-foreground mt-0.5">{e.description}</div>}
                  </TableCell>
                  <TableCell>
                    <span className="bg-secondary/20 text-secondary-foreground px-2 py-1 rounded text-xs">
                      {e.event_type || "Event"}
                    </span>
                  </TableCell>
                  {isAdmin && (
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(e)}>
                        <Pencil className="h-4 w-4 text-muted-foreground" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(e.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
              {events.length === 0 && (
                <TableRow><TableCell colSpan={isAdmin ? 4 : 3} className="text-center text-muted-foreground py-8">No events found.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Event" : "Create Event"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Event Title</Label>
              <Input placeholder="e.g. Janmashtami" value={title} onChange={e => setTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" value={eventDate} onChange={e => setEventDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={eventType} onValueChange={setEventType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Festival">Festival</SelectItem>
                  <SelectItem value="Ekadashi">Ekadashi</SelectItem>
                  <SelectItem value="Appearance/Disappearance">Appearance/Disappearance</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Description (Optional)</Label>
              <Textarea placeholder="Fasting details, etc." value={description} onChange={e => setDescription(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save Event</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
