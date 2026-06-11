import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Share2, Users, FileText, Save } from "lucide-react";
import { toast } from "sonner";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useI18n } from "@/lib/i18n";

const CLASS_LEVELS = [
  "OTP",
  "DYS",
  "Bhakti Vriksha Level 1",
  "Bhakti Vriksha Level 2",
  "Bhakti Vriksha Level 3",
  "Bhakti Vriksha Level 4",
];

const TOPIC_TYPES = [
  "Book Reading",
  "Lecture",
  "Exam",
  "Discussion",
  "Others"
];

type DownlineMember = {
  id: string;
  name: string;
  role: string;
};

export default function AttendancePanel() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [downline, setDownline] = useState<DownlineMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const { isAdmin, isStaff } = useIsAdmin();

  // Form State
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [classLevel, setClassLevel] = useState("");
  const [speaker, setSpeaker] = useState("");
  const [coordinator, setCoordinator] = useState("");
  const [presentIds, setPresentIds] = useState<Set<string>>(new Set());
  
  // New States
  const [topicType, setTopicType] = useState("");
  const [topicDetails, setTopicDetails] = useState("");
  const [totalDevotees, setTotalDevotees] = useState<number | "">("");
  const [totalJoined, setTotalJoined] = useState<number | "">("");

  useEffect(() => {
    if (!user || !isStaff) return;
    (async () => {
      let query = supabase.from<{ id: string; full_name?: string; devotee_level?: string }>("profiles").select("id, full_name, devotee_level");
      
      if (!isAdmin) {
        const { data: assigned, error: rpcError } = await supabase.rpc<{ user_id: string }>("get_downline_ids", { _root: user.id });
        if (rpcError) {
          console.error(rpcError);
        } else if (assigned && assigned.length > 0) {
          const allowedIds = assigned.map(d => d.user_id);
          query = query.in("id", allowedIds);
        } else {
          setDownline([]);
          setLoading(false);
          return;
        }
      }
      
      const { data } = await query.order("full_name");
      if (data) {
        setDownline(data.map(p => ({
          id: p.id,
          name: p.full_name || "Unknown Devotee",
          role: p.devotee_level || "Devotee"
        })));
        
        // Auto-fill total devotees if they haven't set it manually
        if (totalDevotees === "") {
          setTotalDevotees(data.length);
        }
      }
      setLoading(false);
    })();
  }, [user, isAdmin, isStaff, totalDevotees]);

  // Sync checkboxes with "totalJoined" if the user hasn't overridden it manually heavily
  useEffect(() => {
    if (presentIds.size > 0) {
      setTotalJoined(presentIds.size);
    }
  }, [presentIds]);

  const togglePresent = (id: string) => {
    setPresentIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSave = async () => {
    if (!classLevel) return toast.error("Please select a class level");
    if (!topicType) return toast.error("Please select a topic type");
    if (!totalDevotees || !totalJoined) return toast.error("Please enter the total devotees and joined count");
    
    setSaving(true);
    try {
      const { error } = await supabase.from("class_attendance").insert({
        class_date: date,
        class_level: classLevel,
        topic_type: topicType,
        topic_details: topicDetails,
        speaker,
        coordinator,
        total_devotees_in_class: Number(totalDevotees),
        total_devotees_joined: Number(totalJoined),
        absent_devotees: Number(totalDevotees) - Number(totalJoined),
        present_ids: Array.from(presentIds),
        recorded_by: user!.id
      });

      if (error) throw error;
      toast.success("Attendance saved successfully!");
      
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to save attendance";
      toast.error("Failed to save attendance: " + message);
    } finally {
      setSaving(false);
    }
  };

  const generateReport = () => {
    if (!classLevel) {
      toast.error("Please select a class level");
      return null;
    }
    
    const presentList = downline.filter(d => presentIds.has(d.id));
    const absentList = downline.filter(d => !presentIds.has(d.id));

    const absentCount = Number(totalDevotees || 0) - Number(totalJoined || 0);

    const report = `*Seva / Class Attendance Report* 📝
📅 *Date:* ${new Date(date).toLocaleDateString('en-IN')}
📚 *Class:* ${classLevel}
📖 *Topic:* ${topicType} ${topicDetails ? `(${topicDetails})` : ''}
🗣️ *Speaker:* ${speaker || "N/A"}
👤 *Coordinator:* ${coordinator || "N/A"}

📊 *Overview:*
Total Devotees in Class: ${totalDevotees}
Total Joined: ${totalJoined}
Total Absent: ${absentCount}

✅ *Present Devotees Checked (${presentList.length}):*
${presentList.length > 0 ? presentList.map((d, i) => `${i + 1}. ${d.name}`).join("\n") : "None"}

❌ *Absent Devotees Checked (${absentList.length}):*
${absentList.length > 0 ? absentList.map((d, i) => `${i + 1}. ${d.name}`).join("\n") : "None"}`;
    return report;
  };

  const shareWhatsApp = () => {
    const report = generateReport();
    if (report) {
      window.open(`https://wa.me/?text=${encodeURIComponent(report)}`, "_blank");
    }
  };

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading downline...</div>;

  const absentCount = (Number(totalDevotees) || 0) - (Number(totalJoined) || 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-3xl font-serif text-primary">Class Attendance</h1>
        <div className="flex gap-2">
          <Button onClick={shareWhatsApp} variant="outline" className="text-green-600 border-green-600 hover:bg-green-50">
            <Share2 className="w-4 h-4 mr-2" /> Share WhatsApp
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="w-4 h-4 mr-2" /> {saving ? "Saving..." : "Save to DB"}
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5"/> Class Details</CardTitle>
            <CardDescription>Enter the details for today's session</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
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
            </div>

            <div>
              <Label>Topic Type</Label>
              <Select value={topicType} onValueChange={setTopicType}>
                <SelectTrigger><SelectValue placeholder="Select topic" /></SelectTrigger>
                <SelectContent>
                  {TOPIC_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {topicType === "Book Reading" && (
              <div>
                <Label>Book Reading Details</Label>
                <Input placeholder="E.g. Bhagavad Gita, Chapter 2, Page 45" value={topicDetails} onChange={e => setTopicDetails(e.target.value)} />
              </div>
            )}
            
            {topicType === "Lecture" && (
              <div>
                <Label>Lecture Details</Label>
                <Input placeholder="E.g. Srimad Bhagavatam Canto 1, Chapter 2" value={topicDetails} onChange={e => setTopicDetails(e.target.value)} />
              </div>
            )}

            {topicType === "Exam" && (
              <div>
                <Label>Exam Details</Label>
                <Input placeholder="E.g. How many devotees gave the exam? Name of exam?" value={topicDetails} onChange={e => setTopicDetails(e.target.value)} />
              </div>
            )}

            {topicType === "Others" && (
              <div>
                <Label>Specify Other Topic</Label>
                <Input placeholder="E.g. Kirtan Mela, Festival..." value={topicDetails} onChange={e => setTopicDetails(e.target.value)} />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Speaker Name</Label>
                <Input placeholder="E.g. H.G Sadbhuj Gaur Das" value={speaker} onChange={e => setSpeaker(e.target.value)} />
              </div>
              <div>
                <Label>Coordinator Name</Label>
                <Input placeholder="E.g. Tushit Prabhuji" value={coordinator} onChange={e => setCoordinator(e.target.value)} />
              </div>
            </div>
            
            <div className="p-4 bg-muted/30 rounded-lg border space-y-3 mt-4">
              <h3 className="font-semibold text-sm border-b pb-2">Manual Headcount</h3>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs">Total in Class</Label>
                  <Input type="number" min="0" value={totalDevotees} onChange={e => setTotalDevotees(e.target.value ? Number(e.target.value) : "")} />
                </div>
                <div>
                  <Label className="text-xs">Total Joined</Label>
                  <Input type="number" min="0" value={totalJoined} onChange={e => setTotalJoined(e.target.value ? Number(e.target.value) : "")} />
                </div>
                <div>
                  <Label className="text-xs">Absent</Label>
                  <div className="h-10 flex items-center px-3 border rounded-md bg-muted/50 font-bold text-red-500">
                    {absentCount >= 0 ? absentCount : 0}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5"/> Mark Attendance (Optional)</CardTitle>
            <CardDescription>Select specific devotees who are present today to record their names</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-md max-h-[400px] overflow-y-auto p-4 space-y-3">
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
