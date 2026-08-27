import { useEffect, useState } from "react";
import { Plus, LogOut } from "lucide-react";
import { supabase } from "./lib/supabaseClient";

function formatBRL(v) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);
}

export default function Dashboard({ session }) {
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadTransactions();
  }, []);

  async function loadTransactions() {
    setLoading(true);
    // RLS garante que só voltam linhas do usuário logado — não precisa
    // filtrar por user_id manualmente, o banco já faz isso sozinho.
    const { data, error: err } = await supabase
      .from("transactions")
      .select("*")
      .order("date", { ascending: false })
      .limit(20);
    if (err) setError(err.message);
    else setTransactions(data || []);
    setLoading(false);
  }

  const totalEntradas = transactions.filter((t) => t.type === "entrada").reduce((s, t) => s + Number(t.amount), 0);
  const totalSaidas = transactions.filter((t) => t.type === "saida").reduce((s, t) => s + Number(t.amount), 0);

  return (
    <div>
      <div className="app-header">
        <h1>Livro-Caixa</h1>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 13, color: "var(--muted)" }}>{session.user.email}</span>
          <button className="btn-logout" onClick={() => supabase.auth.signOut()}>
            <LogOut size={13} style={{ marginRight: 5, verticalAlign: -2 }} /> Sair
          </button>
        </div>
      </div>

      <div className="app-main">
        <div className="panel">
          <h3>Últimos 20 lançamentos (mais recentes primeiro)</h3>
          <p className="empty-note" style={{ marginBottom: 14 }}>
            Entradas: <b className="mono" style={{ color: "var(--ok)" }}>{formatBRL(totalEntradas)}</b>
            {" · "}
            Saídas: <b className="mono" style={{ color: "var(--bad)" }}>{formatBRL(totalSaidas)}</b>
          </p>

          <button className="btn-add" onClick={() => setShowForm(true)} style={{ marginBottom: 16 }}>
            <Plus size={15} /> Novo lançamento
          </button>

          {error && <p className="auth-error">{error}</p>}

          {loading ? (
            <p className="empty-note">Carregando…</p>
          ) : transactions.length === 0 ? (
            <p className="empty-note">Nenhum lançamento ainda. Use o botão acima para começar.</p>
          ) : (
            transactions.map((t) => (
              <div className="tx-row" key={t.id}>
                <span>{t.description || t.category} <span style={{ color: "var(--muted)" }}>· {t.category}</span></span>
                <span className={`mono tx-amt ${t.type === "entrada" ? "pos" : "neg"}`}>
                  {t.type === "entrada" ? "+" : "−"} {formatBRL(t.amount)}
                </span>
              </div>
            ))
          )}
        </div>

        <p className="empty-note" style={{ textAlign: "center" }}>
          Esta é a base da Fase 1 — autenticação real e persistência real já funcionando.
          As demais telas (Gastos, Saúde Financeira, Investimentos, Reserva, Parcelamentos etc.)
          entram nas próximas fases.
        </p>
      </div>

      {showForm && (
        <QuickForm
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); loadTransactions(); }}
        />
      )}
    </div>
  );
}

function QuickForm({ onClose, onSaved }) {
  const [type, setType] = useState("saida");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Outros");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError("");
    const val = parseFloat(String(amount).replace(",", "."));
    if (!amount || Number.isNaN(val) || val <= 0) { setError("Informe um valor válido, maior que zero."); return; }
    if (!date) { setError("Escolha uma data."); return; }

    setSaving(true);
    // user_id é preenchido automaticamente pelo banco (default auth.uid())
    const { error: err } = await supabase.from("transactions").insert({
      type, description: description.trim(), category, amount: val, date, paid: true, fixed: false,
    });
    setSaving(false);
    if (err) { setError(err.message); return; }
    onSaved();
  }

  return (
    <div className="auth-wrap" style={{ position: "fixed", inset: 0, background: "rgba(22,36,31,0.45)" }} onClick={onClose}>
      <div className="auth-card" style={{ maxWidth: 380 }} onClick={(e) => e.stopPropagation()}>
        <h3 className="display" style={{ marginBottom: 16 }}>Novo lançamento</h3>
        <form onSubmit={submit}>
          <div className="field">
            <label>Tipo</label>
            <select value={type} onChange={(e) => setType(e.target.value)} style={{ width: "100%", padding: 10, border: "1px solid var(--line)", borderRadius: 6 }}>
              <option value="saida">Saída</option>
              <option value="entrada">Entrada</option>
            </select>
          </div>
          <div className="field">
            <label>Descrição</label>
            <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ex: Mercado, Salário…" />
          </div>
          <div className="field">
            <label>Categoria</label>
            <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Ex: Alimentação" />
          </div>
          <div className="field">
            <label>Valor (R$)</label>
            <input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0,00" />
          </div>
          <div className="field">
            <label>Data</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          {error && <p className="auth-error">{error}</p>}
          <button className="btn-primary" type="submit" disabled={saving}>{saving ? "Salvando…" : "Salvar"}</button>
        </form>
      </div>
    </div>
  );
}
