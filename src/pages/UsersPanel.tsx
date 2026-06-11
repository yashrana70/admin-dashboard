import { useState, useEffect, useCallback, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ShieldAlert, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { useIsAdmin } from "@/hooks/useIsAdmin";
type UserProfile = {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  assigned_mentor?: string;
  devotee_level?: string;
  iskcon_temple?: string;
};

export default function UsersPanel() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedTemple, setSelectedTemple] = useState<string>("All");

  const { user } = useAuth();
  const { isAdmin, isStaff } = useIsAdmin();
  
  const fetchUsers = useCallback(async () => {
    try {
      let query = supabase.from<UserProfile>("profiles").select("*").order("created_at", { ascending: false });
      if (!isAdmin) {
        const { data: assignedDevotees, error: rpcError } = await supabase.rpc<{ user_id: string }>("get_downline_ids", { _root: user?.id });
        if (rpcError) throw rpcError;
        const allowedIds = (assignedDevotees || []).map(d => d.user_id);
        if (allowedIds.length === 0) {
          setUsers([]);
          return;
        }
        query = query.in("id", allowedIds);
      }
      const { data, error } = await query;
      if (error) throw error;
      if (data) setUsers(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load users";
      toast.error("Failed to load users: " + message);
    }
  }, [user, isAdmin, isStaff]);

  useEffect(() => {
    if (user && isStaff) fetchUsers();
  }, [user, isStaff, fetchUsers]);

  if (!isAdmin && isStaff) {
    return (
      <div className="flex-1 p-4 md:p-8 flex items-center justify-center">
        <Card className="max-w-md w-full border-red-500/20">
          <CardHeader className="text-center">
            <ShieldAlert className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-2xl text-red-500">Admin Access Required</CardTitle>
          </CardHeader>
          <CardContent className="text-center text-muted-foreground">
            You do not have permission to view the All Users Database.
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleUpdate = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setIsUpdating(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: editingUser.full_name,
        phone: editingUser.phone,
        assigned_mentor: editingUser.assigned_mentor,
        devotee_level: editingUser.devotee_level,
      })
      .eq("id", editingUser.id);

    setIsUpdating(false);

    if (error) {
      toast.error("Failed to update user details.");
    } else {
      toast.success("User details updated successfully!");
      setEditingUser(null);
      fetchUsers();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-serif text-primary">All Registered Users</h1>
        <Select value={selectedTemple} onValueChange={setSelectedTemple}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by Temple" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Temples</SelectItem>
            <SelectItem value="Iskcon Ayodhya">Iskcon Ayodhya</SelectItem>
            <SelectItem value="Iskcon Jankipurram">Iskcon Jankipurram</SelectItem>
            <SelectItem value="Saksham">Saksham</SelectItem>
            <SelectItem value="Others">Others</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Devotee Database</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Full Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Temple</TableHead>
                  <TableHead>Mentor</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(selectedTemple === "All" ? users : users.filter(u => u.iskcon_temple === selectedTemple)).map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.full_name}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>{u.phone}</TableCell>
                    <TableCell>{u.iskcon_temple || "N/A"}</TableCell>
                    <TableCell>{u.assigned_mentor || "None"}</TableCell>
                    <TableCell>{u.devotee_level}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => setEditingUser(u)}>
                        <Edit2 className="h-4 w-4 mr-1" /> Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {(selectedTemple === "All" ? users : users.filter(u => u.iskcon_temple === selectedTemple)).length === 0 && (
                  <TableRow><TableCell colSpan={7} className="text-center py-4 text-muted-foreground">No users found.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Devotee Details</DialogTitle>
          </DialogHeader>
          {editingUser && (
            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input
                  value={editingUser.full_name || ""}
                  onChange={(e) => setEditingUser({ ...editingUser, full_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input
                  value={editingUser.phone || ""}
                  onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Assigned Mentor</Label>
                <Input
                  value={editingUser.assigned_mentor || ""}
                  onChange={(e) => setEditingUser({ ...editingUser, assigned_mentor: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Devotee Level</Label>
                <Input
                  value={editingUser.devotee_level || ""}
                  onChange={(e) => setEditingUser({ ...editingUser, devotee_level: e.target.value })}
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditingUser(null)}>Cancel</Button>
                <Button type="submit" disabled={isUpdating}>{isUpdating ? "Saving..." : "Save Changes"}</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
