import { useEffect, useState } from "react";
import { LayoutDashboard, ArrowLeftRight, Receipt, Settings, LogOut } from "lucide-react";
import { supabase } from "./lib/supabaseClient";
import DashboardPage from "./pages/DashboardPage";
import MovimentacoesPage from "./pages/MovimentacoesPage";
import GastosPage from "./pages/GastosPage";
import ConfiguracoesPage from "./pages/ConfiguracoesPage";

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "movimentacoes", label: "Movimentações", icon: ArrowLeftRight },
  { id: "gastos", label: "Gastos", icon: Receipt },
  { id: "configuracoes", label: "Configurações", icon: Settings },
];

export default function Layout({ session }) {
  const [activePage, setActivePage] = useState("dashboard");
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    const [tx, cats, pms] = await Promise.all([
      supabase.from("transactions").select("*").order("date", { ascending: false }),
      supabase.from("categories").select("*").order("name"),
      supabase.from("payment_methods").select("*").order("name"),
    ]);
    setTransactions(tx.data || []);
    setCategories(cats.data || []);
    setPaymentMethods(pms.data || []);
    setLoading(false);
  }

  const pageProps = {
    session, transactions, categories, paymentMethods,
    reloadTransactions: async () => {
      const { data } = await supabase.from("transactions").select("*").order("date", { ascending: false });
      setTransactions(data || []);
    },
    reloadCategories: async () => {
      const { data } = await supabase.from("categories").select("*").order("name");
      setCategories(data || []);
    },
    reloadPaymentMethods: async () => {
      const { data } = await supabase.from("payment_methods").select("*").order("name");
      setPaymentMethods(data || []);
    },
  };

  return (
    <div className="shell">
      <aside className="shell-sidebar">
        <div className="shell-brand">Sistema Financeiro</div>
        <nav className="shell-nav">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                className={`shell-nav-item ${activePage === item.id ? "active" : ""}`}
                onClick={() => setActivePage(item.id)}
              >
                <Icon size={16} /> {item.label}
              </button>
            );
          })}
        </nav>
        <div className="shell-user">
          <span>{session.user.email}</span>
          <button className="btn-logout" onClick={() => supabase.auth.signOut()}>
            <LogOut size={13} style={{ marginRight: 5, verticalAlign: -2 }} /> Sair
          </button>
        </div>
      </aside>

      <main className="shell-main">
        {loading ? (
          <p className="empty-note">Carregando…</p>
        ) : activePage === "dashboard" ? (
          <DashboardPage {...pageProps} />
        ) : activePage === "movimentacoes" ? (
          <MovimentacoesPage {...pageProps} />
        ) : activePage === "gastos" ? (
          <GastosPage {...pageProps} />
        ) : activePage === "configuracoes" ? (
          <ConfiguracoesPage {...pageProps} />
        ) : null}
      </main>

      <nav className="shell-bottomnav">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <button key={item.id} className={activePage === item.id ? "active" : ""} onClick={() => setActivePage(item.id)}>
              <Icon size={18} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
