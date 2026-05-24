import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ShieldAlert } from "lucide-react";

export default function UsersPanel() {
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      // Fetch all profiles (email is stored here during registration)
      const { data } = await supabase.from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (data) setUsers(data);
    })();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-serif text-primary">All Registered Users</h1>
      
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md flex items-start gap-3">
        <ShieldAlert className="text-yellow-600 h-5 w-5 mt-0.5" />
        <div>
          <h3 className="text-yellow-800 font-semibold text-sm">Security Notice: Passwords are Encrypted</h3>
          <p className="text-yellow-700 text-sm mt-1">
            Supabase uses bank-level encryption. It is cryptographically impossible for anyone (even the Admin) to see a user's password. If a user forgets their password, they must use the "Forgot Password" button on the login screen to reset it.
          </p>
        </div>
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
                  <TableHead>Mentor</TableHead>
                  <TableHead>Level</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.full_name}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>{u.phone}</TableCell>
                    <TableCell>{u.assigned_mentor || "None"}</TableCell>
                    <TableCell>{u.devotee_level}</TableCell>
                  </TableRow>
                ))}
                {users.length === 0 && (
                  <TableRow><TableCell colSpan={5} className="text-center py-4 text-muted-foreground">No users registered yet.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
