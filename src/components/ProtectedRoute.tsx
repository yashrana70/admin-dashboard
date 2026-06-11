import { Navigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const [role, setRole] = useState<string | null>(null);
  const [roleLoading, setRoleLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setRoleLoading(false);
      return;
    }
    supabase.from("user_roles").select("role").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => {
        if (data) setRole(data.role);
        setRoleLoading(false);
      });
  }, [user]);

  if (loading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Hardcode the admin email just like App 1
  if (user.email === "sonuranaas56@gmail.com") {
    return <>{children}</>;
  }

  if (role !== "admin" && role !== "operator" && role !== "volunteer") {
    // Redirect or block
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-center p-4">
        <h1 className="text-3xl font-serif mb-4 text-red-500">Access Denied</h1>
        <p className="text-muted-foreground mb-6">This dashboard is only for Admins, Operators, and Volunteers.</p>
        <button onClick={() => supabase.auth.signOut()} className="text-primary hover:underline">
          Sign out
        </button>
      </div>
    );
  }

  return <>{children}</>;
};
