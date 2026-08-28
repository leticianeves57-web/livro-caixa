import { useEffect, useState } from "react";
import { LayoutDashboard, ArrowLeftRight, Receipt, Activity, TrendingUp, PiggyBank, CreditCard, ShoppingBag, Settings, LogOut } from "lucide-react";
import { supabase } from "./lib/supabaseClient";
import DashboardPage from "./pages/DashboardPage";
import MovimentacoesPage from "./pages/MovimentacoesPage";
import GastosPage from "./pages/GastosPage";
import SaudeFinanceiraPage from "./pages/SaudeFinanceiraPage";
import InvestimentosPage from "./pages/InvestimentosPage";
import ReservaPage from "./pages/ReservaPage";
import ParcelamentosPage from "./pages/ParcelamentosPage";
import ListaComprasPage from "./pages/ListaComprasPage";
import ConfiguracoesPage from "./pages/ConfiguracoesPage";

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "saude", label: "Saúde Financeira", icon: Activity },
  { id: "movimentacoes", label: "Movimentações", icon: ArrowLeftRight },
  { id: "gastos", label: "Gastos", icon: Receipt },
  { id: "investimentos", label: "Investimentos", icon: TrendingUp },
  { id: "reserva", label: "Reserva", icon: PiggyBank },
  { id: "parcelamentos", label: "Parcelamentos", icon: CreditCard },
  { id: "compras", label: "Lista de Compras", icon: ShoppingBag },
  { id: "configuracoes", label: "Configurações", icon: Settings },
];

export default function Layout({ session }) {
  const [activePage, setActivePage] = useState("dashboard");
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [investments, setInvestments] = useState([]);
  const [investmentTypes, setInvestmentTypes] = useState([]);
  const [reserveMovements, setReserveMovements] = useState([]);
  const [settings, setSettings] = useState({ reserve_goal: 0 });
  const [installmentPlans, setInstallmentPlans] = useState([]);
  const [shoppingList, setShoppingList] = useState([]);

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    const [tx, cats, pms, inv, invTypes, res, sett, plans, shop] = await Promise.all([
      supabase.from("transactions").select("*").order("date", { ascending: false }),
      supabase.from("categories").select("*").order("name"),
      supabase.from("payment_methods").select("*").order("name"),
      supabase.from("investment_movements").select("*").order("date", { ascending: false }),
      supabase.from("investment_types").select("*").order("name"),
      supabase.from("reserve_movements").select("*").order("date", { ascending: false }),
      supabase.from("user_settings").select("*").eq("user_id", session.user.id).single(),
      supabase.from("installment_plans").select("*").order("first_date", { ascending: false }),
      supabase.from("shopping_list").select("*").order("created_at", { ascending: false }),
    ]);
    setTransactions(tx.data || []);
    setCategories(cats.data || []);
    setPaymentMethods(pms.data || []);
    setInvestments(inv.data || []);
    setInvestmentTypes(invTypes.data || []);
    setReserveMovements(res.data || []);
    setSettings(sett.data || { reserve_goal: 0 });
    setInstallmentPlans(plans.data || []);
    setShoppingList(shop.data || []);
    setLoading(false);
  }

  const pageProps = {
    session, transactions, categories, paymentMethods, investments, investmentTypes, reserveMovements, settings,
    installmentPlans, shoppingList,
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
    reloadInvestments: async () => {
      const { data } = await supabase.from("investment_movements").select("*").order("date", { ascending: false });
      setInvestments(data || []);
    },
    reloadInvestmentTypes: async () => {
      const { data } = await supabase.from("investment_types").select("*").order("name");
      setInvestmentTypes(data || []);
    },
    reloadReserve: async () => {
      const { data } = await supabase.from("reserve_movements").select("*").order("date", { ascending: false });
      setReserveMovements(data || []);
    },
    reloadSettings: async () => {
      const { data } = await supabase.from("user_settings").select("*").eq("user_id", session.user.id).single();
      setSettings(data || { reserve_goal: 0 });
    },
    reloadInstallmentPlans: async () => {
      const { data } = await supabase.from("installment_plans").select("*").order("first_date", { ascending: false });
      setInstallmentPlans(data || []);
    },
    reloadShoppingList: async () => {
      const { data } = await supabase.from("shopping_list").select("*").order("created_at", { ascending: false });
      setShoppingList(data || []);
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
        ) : activePage === "saude" ? (
          <SaudeFinanceiraPage {...pageProps} />
        ) : activePage === "movimentacoes" ? (
          <MovimentacoesPage {...pageProps} />
        ) : activePage === "gastos" ? (
          <GastosPage {...pageProps} />
        ) : activePage === "investimentos" ? (
          <InvestimentosPage {...pageProps} />
        ) : activePage === "reserva" ? (
          <ReservaPage {...pageProps} />
        ) : activePage === "parcelamentos" ? (
          <ParcelamentosPage {...pageProps} />
        ) : activePage === "compras" ? (
          <ListaComprasPage {...pageProps} />
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
