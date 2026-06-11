import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2 } from "lucide-react";
import { useIsAdmin } from "@/hooks/useIsAdmin";

type SadhnaReport = {
  id: string;
  devotee_name: string;
  entry_date: string;
  japa_rounds: number;
  reading_minutes: number | null;
  hearing_minutes: number | null;
  total_marks: number;
};

export default function SadhnaPanel() {
  const { user } = useAuth();
  const { isAdmin, isStaff } = useIsAdmin();
  const [reports, setReports] = useState<SadhnaReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !isStaff) return;
    (async () => {
      setLoading(true);
      try {
        let query = supabase.from("sadhna_entries").select("*").order("entry_date", { ascending: false }).limit(200);

        if (!isAdmin) {
          const { data: downline, error: rpcError } = await supabase.rpc("get_downline_ids", { _root: user.id });
          if (rpcError) throw rpcError;

          if (downline && downline.length > 0) {
            const downlineIds = downline.map((d) => d.user_id);
            downlineIds.push(user.id);
            query = query.in("user_id", downlineIds);
          } else {
            query = query.eq("user_id", user.id);
          }
        }

        const { data, error } = await query;
        if (error) throw error;
        if (data) setReports(data);
      } catch (err: unknown) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [user, isAdmin, isStaff]);

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
