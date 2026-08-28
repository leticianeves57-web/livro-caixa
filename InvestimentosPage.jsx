import { useMemo, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { formatBRL, monthKey, todayStr } from "../lib/utils";
import InvestMovementForm from "../components/InvestMovementForm";
import ConfirmDialog from "../components/ConfirmDialog";

export default function InvestimentosPage({ investments, investmentTypes, reloadInvestments, reloadTransactions }) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const stats = useMemo(() => {
    const net = (arr) => arr.reduce((s, m) => s + (m.type === "aporte" ? Number(m.amount) : -Number(m.amount)), 0);
    const currentMonth = monthKey(todayStr());
    const currentYear = currentMonth.slice(0, 4);
    const mesesComMov = [...new Set(investments.map((m) => monthKey(m.date)))];
    const mediaMensal = mesesComMov.length > 0
      ? mesesComMov.reduce((s, key) => s + net(investments.filter((m) => monthKey(m.date) === key)), 0) / mesesComMov.length
      : null;
    return {
      total: net(investments),
      noAno: net(investments.filter((m) => m.date.slice(0, 4) === currentYear)),
      noMes: net(investments.filter((m) => monthKey(m.date) === currentMonth)),
      mediaMensal,
    };
  }, [investments]);

  async function handleSaved() {
    setShowForm(false);
    setEditing(null);
    reloadInvestments();
    reloadTransactions();
  }

  async function confirmDeleteNow() {
    const mov = investments.find((m) => m.id === confirmDelete);
    if (mov?.linked_transaction_id) {
      await supabase.from("transactions").delete().eq("id", mov.linked_transaction_id);
    }
    await supabase.from("investment_movements").delete().eq("id", confirmDelete);
    setConfirmDelete(null);
    reloadInvestments();
    reloadTransactions();
  }

  return (
    <>
      <div className="panel-head" style={{ marginBottom: 16 }}>
        <h1 className="page-title" style={{ marginBottom: 0 }}>Investimentos</h1>
        <button className="btn-add" onClick={() => setShowForm(true)}><Plus size={14} /> Novo</button>
      </div>

      <div className="mini-cards" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
        <div className="mini-card"><div className="lbl">Total investido</div><div className="val mono" style={{ color: "var(--invest)" }}>{formatBRL(stats.total)}</div></div>
        <div className="mini-card"><div className="lbl">No ano</div><div className="val mono" style={{ color: "var(--invest)" }}>{formatBRL(stats.noAno)}</div></div>
        <div className="mini-card"><div className="lbl">No mês</div><div className="val mono" style={{ color: "var(--invest)" }}>{formatBRL(stats.noMes)}</div></div>
        <div className="mini-card"><div className="lbl">Média mensal</div><div className="val mono">{stats.mediaMensal != null ? formatBRL(stats.mediaMensal) : "—"}</div></div>
      </div>

      <div className="panel">
        <h3>Movimentações</h3>
        {investments.length === 0 ? (
          <p className="empty-note">Nenhum investimento registrado ainda.</p>
        ) : (
          [...investments].sort((a, b) => (a.date < b.date ? 1 : -1)).map((m) => (
            <div className="tx-row-full" key={m.id}>
              <div className="tx-info">
                <span className="tx-desc">{m.investment_type || "Investimento"}{m.institution ? ` · ${m.institution}` : ""}</span>
                <span className="tx-meta">{new Date(m.date + "T00:00:00").toLocaleDateString("pt-BR")} · {m.type === "aporte" ? "Aporte" : "Resgate"}</span>
              </div>
              <span className={`mono tx-amt ${m.type === "aporte" ? "pos" : "neg"}`}>{formatBRL(m.amount)}</span>
              <div className="tx-actions">
                <button className="icon-btn" onClick={() => setEditing(m)}><Pencil size={14} /></button>
                <button className="icon-btn" onClick={() => setConfirmDelete(m.id)}><Trash2 size={14} /></button>
              </div>
            </div>
          ))
        )}
      </div>

      {showForm && <InvestMovementForm investmentTypes={investmentTypes} onClose={() => setShowForm(false)} onSaved={handleSaved} />}
      {editing && <InvestMovementForm investmentTypes={investmentTypes} initialData={editing} onClose={() => setEditing(null)} onSaved={handleSaved} />}
      {confirmDelete && (
        <ConfirmDialog
          message="Tem certeza que deseja excluir esta movimentação de investimento?"
          onCancel={() => setConfirmDelete(null)}
          onConfirm={confirmDeleteNow}
        />
      )}
    </>
  );
}
