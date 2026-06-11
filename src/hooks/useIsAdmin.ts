import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export function useIsAdmin() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isOperator, setIsOperator] = useState(false);
  const [isVolunteer, setIsVolunteer] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    if (!user) {
      setIsAdmin(false);
      setIsOperator(false);
      setIsVolunteer(false);
      setLoading(false);
      return;
    }
    setLoading(true);
    (async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();
      if (active) {
        setIsAdmin(data?.role === "admin");
        setIsOperator(data?.role === "operator");
        setIsVolunteer(data?.role === "volunteer");
        setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [user]);

  const isStaff = isAdmin || isOperator || isVolunteer;

  return { isAdmin, isOperator, isVolunteer, isStaff, loading };
}
