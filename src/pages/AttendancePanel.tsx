import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Share2, Users, FileText } from "lucide-react";
import { toast } from "sonner";

const CLASS_LEVELS = [
  "OTP",
  "DYS",
  "Bhakti Vriksha Level 1",
  "Bhakti Vriksha Level 2",
  "Bhakti Vriksha Level 3",
  "Bhakti Vriksha Level 4",
];

export default function AttendancePanel() {
  const { user } = useAuth();
  const [downline, setDownline] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [classLevel, setClassLevel] = useState("");
  const [speaker, setSpeaker] = useState("");
  const [coordinator, setCoordinator] = useState("");
  const [presentIds, setPresentIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;
    (async () => {
      // Fetch downline for this user
      const { data } = await supabase.rpc("get_hierarchy_tree");
      if (data) {
        // Filter out non-devotees if needed, or just show all
        setDownline(data.filter((n: any) => n.role === 'devotee' || n.role === 'volunteer'));
      }
      setLoading(false);
    })();
  }, [user]);

  const togglePresent = (id: string) => {
    setPresentIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const generateReport = () => {
    if (!classLevel) {
      toast.error("Please select a class level");
      return;
    }
    
    const presentList = downline.filter(d => presentIds.has(d.id));
    const absentList = downline.filter(d => !presentIds.has(d.id));

    const report = `*Seva / Class Attendance Report* 📝
📅 *Date:* ${new Date(date).toLocaleDateString('en-IN')}
📚 *Class:* ${classLevel}
🗣️ *Speaker:* ${speaker || "N/A"}
👤 *Coordinator:* ${coordinator || "N/A"}

✅ *Present Devotees (${presentList.length}):*
${presentList.length > 0 ? presentList.map((d, i) => `${i + 1}. ${d.name}`).join("\n") : "None"}

❌ *Absent Devotees (${absentList.length}):*
${absentList.length > 0 ? absentList.map((d, i) => `${i + 1}. ${d.name}`).join("\n") : "None"}

📊 *Total Registered:* ${downline.length}
`;
    return report;
  };

  const shareWhatsApp = () => {
    const report = generateReport();
    if (report) {
      window.open(`https://wa.me/?text=${encodeURIComponent(report)}`, "_blank");
    }
  };

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading downline...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-serif text-primary">Class Attendance</h1>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5"/> Class Details</CardTitle>
            <CardDescription>Enter the details for today's session</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Date</Label>
              <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
            </div>
            <div>
              <Label>Class Level</Label>
              <Select value={classLevel} onValueChange={setClassLevel}>
                <SelectTrigger><SelectValue placeholder="Select class level" /></SelectTrigger>
                <SelectContent>
                  {CLASS_LEVELS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Speaker Name</Label>
              <Input placeholder="E.g. H.G Sadbhuj Gaur Das" value={speaker} onChange={e => setSpeaker(e.target.value)} />
            </div>
            <div>
              <Label>Coordinator Name</Label>
              <Input placeholder="E.g. Tushit Prabhuji" value={coordinator} onChange={e => setCoordinator(e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5"/> Mark Attendance</CardTitle>
            <CardDescription>Select the devotees who are present today</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-md max-h-[300px] overflow-y-auto p-4 space-y-3">
              {downline.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No devotees assigned to your downline.</p>
              ) : (
                downline.map(d => (
                  <div key={d.id} className="flex items-center space-x-3">
                    <Checkbox 
                      id={`dev-${d.id}`} 
                      checked={presentIds.has(d.id)}
                      onCheckedChange={() => togglePresent(d.id)}
                    />
                    <label htmlFor={`dev-${d.id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
                      {d.name} <span className="text-xs text-muted-foreground ml-2 capitalize">({d.role})</span>
                    </label>
                  </div>
                ))
              )}
            </div>

            <div className="mt-6 flex gap-3">
              <Button onClick={shareWhatsApp} className="w-full bg-green-600 hover:bg-green-700 text-white">
                <Share2 className="w-4 h-4 mr-2" /> Share Report via WhatsApp
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
