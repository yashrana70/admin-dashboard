import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronRight, Crown, Users, User, Edit2, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

type Node = {
  id: string;
  name: string;
  role: string;
  parent_id: string | null;
};

export default function Hierarchy() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Node>>({});

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("hierarchy_nodes")
      .select("id,name,role,parent_id")
      .order("name");
    setNodes((data as Node[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const { roots, childrenMap } = useMemo(() => {
    const map: Record<string, Node[]> = {};
    const r: Node[] = [];
    nodes.forEach((n) => {
      if (n.parent_id) {
        (map[n.parent_id] ||= []).push(n);
      } else {
        r.push(n);
      }
    });
    return { roots: r, childrenMap: map };
  }, [nodes]);

  const openEditor = (node?: Node) => {
    if (node) {
      setEditData(node);
    } else {
      setEditData({ name: "", role: "devotee", parent_id: null });
    }
    setIsEditing(true);
  };

  const saveNode = async () => {
    if (!editData.name) {
      toast.error("Name is required");
      return;
    }
    const payload = {
      name: editData.name,
      role: editData.role,
      parent_id: editData.parent_id || null,
    };

    if (editData.id) {
      const { error } = await supabase.from("hierarchy_nodes").update(payload).eq("id", editData.id);
      if (error) toast.error(error.message);
      else toast.success("Updated successfully");
    } else {
      const { error } = await supabase.from("hierarchy_nodes").insert(payload);
      if (error) toast.error(error.message);
      else toast.success("Added successfully");
    }
    setIsEditing(false);
    load();
  };

  const deleteNode = async (id: string) => {
    if (childrenMap[id] && childrenMap[id].length > 0) {
      toast.error("Cannot delete a node that has children. Move them first.");
      return;
    }
    if (confirm("Are you sure you want to delete this devotee from the hierarchy?")) {
      const { error } = await supabase.from("hierarchy_nodes").delete().eq("id", id);
      if (error) toast.error(error.message);
      else {
        toast.success("Deleted successfully");
        load();
      }
    }
  };

  function TreeNode({
    node,
    depth,
  }: {
    node: Node;
    depth: number;
  }) {
    const [open, setOpen] = useState(depth < 2);
    const kids = childrenMap[node.id] || [];
    const hasKids = kids.length > 0;
    const Icon = node.role === "admin" ? Crown : node.role === "facilitator" ? Users : User;

    return (
      <div className="select-none">
        <div
          className="flex items-center gap-2 py-1.5 rounded-md hover:bg-muted/50 px-2 group"
          style={{ paddingLeft: depth * 14 + 8 }}
        >
          <div className="flex-1 flex items-center gap-2 cursor-pointer" onClick={() => hasKids && setOpen(!open)}>
            {hasKids ? (
              open ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
                   : <ChevronRight className="h-4 w-4 text-muted-foreground" />
            ) : <span className="w-4" />}
            <Icon className={`h-4 w-4 ${node.role === "admin" ? "text-primary" : node.role === "facilitator" ? "text-amber-600" : "text-muted-foreground"}`} />
            <span className="text-sm font-medium">{node.name}</span>
            <Badge variant={node.role === "admin" ? "default" : "secondary"} className="text-[10px] capitalize">
              {node.role}
            </Badge>
          </div>
          
          <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openEditor(node)}>
              <Edit2 className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => deleteNode(node.id)}>
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
        {open && hasKids && (
          <div>
            {kids.map((c) => (
              <TreeNode key={c.id} node={c} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-3xl">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-serif font-bold">Hierarchy Editor</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load}>Refresh</Button>
          <Button size="sm" onClick={() => openEditor()} className="gap-1">
            <Plus className="h-4 w-4" /> Add Node
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Organization Chain</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : roots.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hierarchy data yet.</p>
          ) : (
            <div className="space-y-1">
              {roots.map((r) => (
                <TreeNode key={r.id} node={r} depth={0} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editData.id ? "Edit Devotee Role" : "Add New Devotee"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Name</Label>
              <Input 
                value={editData.name || ""} 
                onChange={e => setEditData({...editData, name: e.target.value})} 
                placeholder="Full Name"
              />
            </div>
            <div className="grid gap-2">
              <Label>Role</Label>
              <Select value={editData.role} onValueChange={v => setEditData({...editData, role: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="facilitator">Facilitator</SelectItem>
                  <SelectItem value="operator">Operator</SelectItem>
                  <SelectItem value="volunteer">Volunteer</SelectItem>
                  <SelectItem value="devotee">Devotee</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Reports To (Parent)</Label>
              <Select value={editData.parent_id || "none"} onValueChange={v => setEditData({...editData, parent_id: v === "none" ? null : v})}>
                <SelectTrigger><SelectValue placeholder="No parent (Root level)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">-- No Parent (Root Level) --</SelectItem>
                  {nodes.filter(n => n.id !== editData.id).map(n => (
                    <SelectItem key={n.id} value={n.id}>{n.name} ({n.role})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
            <Button onClick={saveNode}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
