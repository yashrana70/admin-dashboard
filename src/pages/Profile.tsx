import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Upload, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

type Sibling = { name: string; occupation?: string; dob: string };
type FamilyData = {
  father: Sibling;
  mother: Sibling;
  siblings: Sibling[];
};
type ProfileData = {
  full_name?: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  spiritual_friend_name?: string;
  gender?: string;
  dob?: string;
  education?: string;
  profession?: string;
  marital_status?: string;
  address?: string;
  devotee_level?: string;
  facilitator_name?: string;
  photo_url?: string;
  bhakti_vriksha_level?: number | string;
  family?: FamilyData;
};

export default function Profile() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const [p, setP] = useState({
    full_name: "", email: "", phone: "", whatsapp: "",
    spiritual_friend_name: "", gender: "", dob: "",
    education: "", profession: "", marital_status: "", address: "",
    devotee_level: "", facilitator_name: "", photo_url: "",
    bhakti_vriksha_level: "" as string,
  });
  const [family, setFamily] = useState({
    father: { name: "", occupation: "", dob: "" },
    mother: { name: "", occupation: "", dob: "" },
    siblings: [] as Sibling[],
  });

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from<ProfileData>("profiles").select("*").eq("id", user.id).maybeSingle();
      if (data) {
        setP({
          full_name: data.full_name || "", email: data.email || "", phone: data.phone || "",
          whatsapp: data.whatsapp || "", spiritual_friend_name: data.spiritual_friend_name || "",
          gender: data.gender || "", dob: data.dob || "", education: data.education || "",
          profession: data.profession || "", marital_status: data.marital_status || "",
          address: data.address || "", devotee_level: data.devotee_level || "",
          facilitator_name: data.facilitator_name || "", photo_url: data.photo_url || "",
          bhakti_vriksha_level: data.bhakti_vriksha_level ? String(data.bhakti_vriksha_level) : "",
        });
        const fam = data.family || {};
        setFamily({
          father: fam.father || { name:"", occupation:"", dob:"" },
          mother: fam.mother || { name:"", occupation:"", dob:"" },
          siblings: fam.siblings || [],
        });
      }
      setLoading(false);
    })();
  }, [user]);

  const uploadPhoto = async (file: File) => {
    if (!user) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Image too large (max 5MB)"); return; }
    const ext = file.name.split(".").pop();
    const path = `${user.id}/avatar-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("profile-photos").upload(path, file, { upsert: true });
    if (error) { toast.error(error.message); return; }
    const { data } = supabase.storage.from("profile-photos").getPublicUrl(path);
    setP(prev => ({ ...prev, photo_url: data.publicUrl }));
    toast.success("Photo uploaded");
  };

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from<ProfileData>("profiles").update({
      ...p,
      dob: p.dob || null,
      bhakti_vriksha_level: p.bhakti_vriksha_level ? Number(p.bhakti_vriksha_level) : null,
      family,
    }).eq("id", user.id);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Profile saved 🙏");
  };

  if (loading) return <div className="text-muted-foreground">Loading…</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="font-serif text-3xl">My Profile</h1>
        <p className="text-muted-foreground text-sm">Keep your devotee details up to date</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="font-serif">Profile Photo</CardTitle></CardHeader>
        <CardContent className="flex items-center gap-6">
          <Avatar className="h-24 w-24 ring-2 ring-primary/30">
            <AvatarImage src={p.photo_url} />
            <AvatarFallback className="bg-gradient-primary text-primary-foreground text-2xl font-serif">
              {p.full_name?.[0] || "D"}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col gap-2">
            <input ref={fileRef} type="file" accept="image/*" hidden
              onChange={e => e.target.files?.[0] && uploadPhoto(e.target.files[0])} />
            <input ref={cameraRef} type="file" accept="image/*" capture="user" hidden
              onChange={e => e.target.files?.[0] && uploadPhoto(e.target.files[0])} />
            <Button variant="outline" onClick={() => cameraRef.current?.click()}>
              <Camera className="h-4 w-4 mr-2" /> Take Photo
            </Button>
            <Button variant="outline" onClick={() => fileRef.current?.click()}>
              <Upload className="h-4 w-4 mr-2" /> Upload from Gallery
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="font-serif">Personal Details</CardTitle></CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4">
          <div><Label>Full Name</Label><Input value={p.full_name} onChange={e => setP({...p, full_name: e.target.value})} /></div>
          <div><Label>Spiritual Friend Name</Label><Input value={p.spiritual_friend_name} onChange={e => setP({...p, spiritual_friend_name: e.target.value})} /></div>
          <div><Label>Email</Label><Input value={p.email} disabled /></div>
          <div><Label>Phone</Label><Input value={p.phone} onChange={e => setP({...p, phone: e.target.value})} /></div>
          <div><Label>WhatsApp</Label><Input value={p.whatsapp} onChange={e => setP({...p, whatsapp: e.target.value})} /></div>
          <div><Label>Gender</Label>
            <Select value={p.gender} onValueChange={v => setP({...p, gender: v})}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label>Date of Birth</Label><Input type="date" value={p.dob} onChange={e => setP({...p, dob: e.target.value})} /></div>
          <div><Label>Marital Status</Label>
            <Select value={p.marital_status} onValueChange={v => setP({...p, marital_status: v})}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="single">Single</SelectItem>
                <SelectItem value="married">Married</SelectItem>
                <SelectItem value="brahmachari">Brahmachari</SelectItem>
                <SelectItem value="sannyasi">Sannyasi</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label>Education (optional)</Label><Input value={p.education} onChange={e => setP({...p, education: e.target.value})} /></div>
          <div><Label>Profession (optional)</Label><Input value={p.profession} onChange={e => setP({...p, profession: e.target.value})} /></div>
          <div><Label>Devotee Level</Label><Input value={p.devotee_level} onChange={e => setP({...p, devotee_level: e.target.value})} /></div>
          <div><Label>Bhakti Vriksha Level</Label>
            <Select value={p.bhakti_vriksha_level} onValueChange={v => setP({...p, bhakti_vriksha_level: v})}>
              <SelectTrigger><SelectValue placeholder="Select level (sets target rounds)" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Level 1 — Target 2 rounds</SelectItem>
                <SelectItem value="2">Level 2 — Target 4 rounds</SelectItem>
                <SelectItem value="3">Level 3 — Target 8 rounds</SelectItem>
                <SelectItem value="4">Level 4 — Target 16 rounds</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label>Facilitator Name</Label><Input value={p.facilitator_name} onChange={e => setP({...p, facilitator_name: e.target.value})} /></div>
          <div className="md:col-span-2"><Label>Full Address</Label>
            <Textarea value={p.address} onChange={e => setP({...p, address: e.target.value})} rows={3} /></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="font-serif">Family Details</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          {(["father","mother"] as const).map(key => (
            <div key={key}>
              <h4 className="font-semibold capitalize mb-2">{key}</h4>
              <div className="grid md:grid-cols-3 gap-3">
                <Input placeholder="Name" value={family[key].name}
                  onChange={e => setFamily({...family, [key]: {...family[key], name: e.target.value}})} />
                <Input placeholder="Occupation" value={family[key].occupation}
                  onChange={e => setFamily({...family, [key]: {...family[key], occupation: e.target.value}})} />
                <Input type="date" value={family[key].dob}
                  onChange={e => setFamily({...family, [key]: {...family[key], dob: e.target.value}})} />
              </div>
            </div>
          ))}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold">Siblings</h4>
              <Button size="sm" variant="outline" onClick={() => setFamily({...family, siblings: [...family.siblings, {name:"",dob:""}]})}>
                <Plus className="h-4 w-4 mr-1" /> Add
              </Button>
            </div>
            <div className="space-y-2">
              {family.siblings.map((s, i) => (
                <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2">
                  <Input placeholder="Name" value={s.name}
                    onChange={e => { const sib=[...family.siblings]; sib[i]={...sib[i], name:e.target.value}; setFamily({...family, siblings:sib}); }} />
                  <Input type="date" value={s.dob}
                    onChange={e => { const sib=[...family.siblings]; sib[i]={...sib[i], dob:e.target.value}; setFamily({...family, siblings:sib}); }} />
                  <Button variant="ghost" size="icon" onClick={() => setFamily({...family, siblings: family.siblings.filter((_,j)=>j!==i)})}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {family.siblings.length === 0 && <p className="text-sm text-muted-foreground">No siblings added.</p>}
            </div>
          </div>
        </CardContent>
      </Card>

      <Button onClick={save} disabled={saving} size="lg" className="bg-gradient-primary text-primary-foreground">
        {saving ? "Saving…" : "Save Profile"}
      </Button>
    </div>
  );
}
