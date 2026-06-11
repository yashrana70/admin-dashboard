import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

type Purchase = {
  id: string;
  user_id: string;
  book_title: string;
  amount: string;
  transaction_id: string;
  status: string;
  created_at: string;
  profiles: {
    first_name: string;
    last_name: string;
    email: string;
  };
};

export default function DonationsPanel() {
  const { data: purchases, isLoading, refetch } = useQuery({
    queryKey: ['admin_purchases'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('book_purchases')
        .select('*, profiles(first_name, last_name, email)')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      return data as Purchase[];
    }
  });

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('book_purchases')
        .update({ status: newStatus })
        .eq('id', id);
        
      if (error) throw error;
      toast.success(`Purchase marked as ${newStatus}`);
      refetch();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update status");
    }
  };

  if (isLoading) return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading purchase history...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-serif font-bold">Donations & Book Purchases</h2>
        <p className="text-muted-foreground">Verify and manage devotee book purchases.</p>
      </div>

      <div className="border rounded-lg overflow-hidden bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Devotee</TableHead>
              <TableHead>Book Title</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Transaction ID</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {purchases?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No purchases found.
                </TableCell>
              </TableRow>
            ) : (
              purchases?.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="whitespace-nowrap">
                    {format(new Date(p.created_at), 'MMM d, yyyy h:mm a')}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{p.profiles?.first_name} {p.profiles?.last_name}</div>
                    <div className="text-xs text-muted-foreground">{p.profiles?.email}</div>
                  </TableCell>
                  <TableCell className="font-medium">{p.book_title}</TableCell>
                  <TableCell>{p.amount}</TableCell>
                  <TableCell className="font-mono text-xs">{p.transaction_id}</TableCell>
                  <TableCell>
                    <Badge variant={p.status === 'verified' ? 'default' : p.status === 'rejected' ? 'destructive' : 'secondary'}>
                      {p.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {p.status === 'pending' && (
                      <div className="flex justify-end gap-2">
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-green-500 hover:text-green-600 hover:bg-green-50" onClick={() => updateStatus(p.id, 'verified')} title="Verify">
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => updateStatus(p.id, 'rejected')} title="Reject">
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
