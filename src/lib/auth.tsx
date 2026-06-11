import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AuthCtx = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthCtx>({ user: null, session: null, loading: true, signOut: async () => {} });

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let initialized = false;
    const urlParams = new URLSearchParams(window.location.search);
    const accessToken = urlParams.get("access_token");
    const refreshToken = urlParams.get("refresh_token");

    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      // Wait for manual setSession if tokens exist in URL
      if (!accessToken && !initialized) {
        initialized = true;
        setLoading(false);
      }
    });

    if (accessToken && refreshToken) {
      // Strip tokens from URL for security/cleanliness
      window.history.replaceState({}, document.title, window.location.pathname);
      supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
        .then(({ data }) => {
          setSession(data.session);
        })
        .catch(err => console.error("Session set error:", err))
        .finally(() => {
          if (!initialized) {
            initialized = true;
            setLoading(false);
          }
        });
    } else {
      // Initial session fetch
      supabase.auth.getSession()
        .then(({ data }) => {
          setSession(data.session);
        })
        .catch(err => console.error("Session get error:", err))
        .finally(() => {
          if (!initialized) {
            initialized = true;
            setLoading(false);
          }
        });
    }
    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <Ctx.Provider
      value={{
        user: session?.user ?? null,
        session,
        loading,
        signOut: async () => { await supabase.auth.signOut(); },
      }}
    >
      {children}
    </Ctx.Provider>
  );
};

export const useAuth = () => useContext(Ctx);
