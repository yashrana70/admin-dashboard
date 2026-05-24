import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2 } from "lucide-react";

export default function SadhnaPanel() {
  const { user } = useAuth();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      try {
        let isAdmin = user.email === "sonuranaas56@gmail.com";
        if (!isAdmin) {
          const { data: roleData } = await supabase.from("user_roles").select("role").eq("user_id", user.id).maybeSingle();
          if (roleData?.role === "admin") isAdmin = true;
        }

        let query = supabase.from("sadhna_entries").select("*").order("entry_date", { ascending: false }).limit(200);

        if (!isAdmin) {
          // If not admin, they are operator/volunteer. Fetch downline IDs
          const { data: downline } = await supabase.rpc("get_downline_ids", { _root: user.id });
          if (downline && downline.length > 0) {
            const downlineIds = downline.map((d: any) => d.user_id);
            // Include themselves as well
            downlineIds.push(user.id);
            query = query.in("user_id", downlineIds);
          } else {
            // No downline, only show themselves
            query = query.eq("user_id", user.id);
          }
        }

        const { data } = await query;
        if (data) setReports(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <h1 className="text-3xl font-serif text-primary">Sadhna Reports</h1>
      
      <Card className="shadow-elegant border-primary/10">
        <CardHeader className="bg-primary/5 rounded-t-xl border-b border-primary/10">
          <CardTitle className="font-serif">Recent Entries (Downline)</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Devotee</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Japa Rounds</TableHead>
                  <TableHead>Reading / Hearing</TableHead>
                  <TableHead>Marks</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.devotee_name}</TableCell>
                    <TableCell>{new Date(r.entry_date).toLocaleDateString()}</TableCell>
                    <TableCell className="font-semibold">{r.japa_rounds}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {r.reading_minutes || 0}m / {r.hearing_minutes || 0}m
                    </TableCell>
                    <TableCell className="text-primary font-bold">{r.total_marks}</TableCell>
                  </TableRow>
                ))}
                {reports.length === 0 && (
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No reports found.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
