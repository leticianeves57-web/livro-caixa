import { useMemo, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { formatBRL, monthKey, todayStr } from "../lib/utils";
import TransactionForm from "../components/TransactionForm";
import ConfirmDialog from "../components/ConfirmDialog";

export default function GastosPage({ transactions, categories, paymentMethods, reloadTransactions }) {
  const [showExpense, setShowExpense] = useState(false);
  const [showIncome, setShowIncome] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const rows = useMemo(() => {
    const currentMonth = monthKey(todayStr());
    return [...transactions].filter((t) => monthKey(t.date) === currentMonth).sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [transactions]);

  async function confirmDeleteNow() {
    await supabase.from("transactions").delete().eq("id", confirmDelete);
    setConfirmDelete(null);
    reloadTransactions();
  }

  return (
    <>
      <h1 className="page-title">Gastos</h1>

      <div className="quick-buttons">
        <button className="quick-btn expense" onClick={() => setShowExpense(true)}><Plus size={18} /> NOVO GASTO</button>
        <button className="quick-btn income" onClick={() => setShowIncome(true)}><Plus size={18} /> NOVA ENTRADA</button>
      </div>

      <div className="panel">
        <h3>Lançamentos do mês</h3>
        {rows.length === 0 ? (
          <p className="empty-note">Nada lançado ainda neste mês. Use os botões acima para começar.</p>
        ) : (
          rows.map((t) => (
            <div className="tx-row-full" key={t.id}>
              <div className="tx-info">
                <span className="tx-desc">{t.description || t.category}</span>
                <span className="tx-meta">{t.category} · {new Date(t.date + "T00:00:00").toLocaleDateString("pt-BR")}</span>
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

      {showExpense && (
        <TransactionForm
          categories={categories} paymentMethods={paymentMethods} defaultType="saida"
          onClose={() => setShowExpense(false)}
          onSaved={() => { setShowExpense(false); reloadTransactions(); }}
        />
      )}
      {showIncome && (
        <TransactionForm
          categories={categories} paymentMethods={paymentMethods} defaultType="entrada"
          onClose={() => setShowIncome(false)}
          onSaved={() => { setShowIncome(false); reloadTransactions(); }}
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
