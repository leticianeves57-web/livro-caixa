import { useEffect, useState } from "react";
import "./styles.css";
import { supabase } from "./lib/supabaseClient";
import Auth from "./Auth";
import Layout from "./Layout";

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  if (loading) {
    return <div className="auth-wrap"><p style={{ color: "var(--muted)" }}>Carregando…</p></div>;
  }

  return session ? <Layout session={session} /> : <Auth />;
}
