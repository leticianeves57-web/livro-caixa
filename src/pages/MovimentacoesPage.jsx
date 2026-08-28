import { useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Check } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { formatBRL, monthKey, todayStr } from "../lib/utils";
import TransactionForm from "../components/TransactionForm";
import ConfirmDialog from "../components/ConfirmDialog";

const MESES = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

export default function MovimentacoesPage({ transactions, categories, paymentMethods, reloadTransactions }) {
  const hoje = new Date();
  const [mes, setMes] = useState(hoje.getMonth());
  const [ano] = useState(hoje.getFullYear());
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const periodo = `${ano}-${String(mes + 1).padStart(2, "0")}`;
  const rows = useMemo(
    () => [...transactions].filter((t) => monthKey(t.date) === periodo).sort((a, b) => (a.date < b.date ? 1 : -1)),
    [transactions, periodo]
  );

  async function togglePaid(t) {
    await supabase.from("transactions").update({ paid: t.paid === false }).eq("id", t.id);
    reloadTransactions();
  }

  async function confirmDeleteNow() {
    await supabase.from("transactions").delete().eq("id", confirmDelete);
    setConfirmDelete(null);
    reloadTransactions();
  }

  return (
    <>
      <h1 className="page-title">Movimentações Mensais</h1>

      <div className="month-tabs">
        {MESES.map((m, i) => (
          <button key={m} className={`month-tab ${i === mes ? "active" : ""}`} onClick={() => setMes(i)}>{m}</button>
        ))}
      </div>

      <div className="panel">
        <div className="panel-head">
          <h3>{MESES[mes]} de {ano}</h3>
          <button className="btn-add" onClick={() => setShowForm(true)}><Plus size={14} /> Novo</button>
        </div>

        {rows.length === 0 ? (
          <p className="empty-note">Nenhuma movimentação lançada em {MESES[mes]}.</p>
        ) : (
          rows.map((t) => (
            <div className="tx-row-full" key={t.id}>
              <button className={`check-btn ${t.paid !== false ? "checked" : ""}`} onClick={() => togglePaid(t)}>
                {t.paid !== false && <Check size={12} />}
              </button>
              <div className="tx-info">
                <span className="tx-desc">{t.description || t.category}</span>
                <span className="tx-meta">{t.category} · {new Date(t.date + "T00:00:00").toLocaleDateString("pt-BR")}{t.payment_method ? ` · ${t.payment_method}` : ""}</span>
              </div>
              <span className={`mono tx-amt ${t.type === "entrada" ? "pos" : "neg"}`}>{formatBRL(t.amount)}</span>
              <div className="tx-actions">
                <button className="icon-btn" onClick={() => setEditing(t)}><Pencil size={14} /></button>
                <button className="icon-btn" onClick={() => setConfirmDelete(t.id)}><Trash2 size={14} /></button>
              </div>
            </div>
          ))
        )}
      </div>

      {showForm && (
        <TransactionForm
          categories={categories} paymentMethods={paymentMethods}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); reloadTransactions(); }}
        />
      )}
      {editing && (
        <TransactionForm
          categories={categories} paymentMethods={paymentMethods} initialData={editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); reloadTransactions(); }}
        />
      )}
      {confirmDelete && (
        <ConfirmDialog
          message="Tem certeza que deseja excluir esta movimentação? Essa ação não pode ser desfeita."
          onCancel={() => setConfirmDelete(null)}
          onConfirm={confirmDeleteNow}
        />
      )}
    </>
  );
}
