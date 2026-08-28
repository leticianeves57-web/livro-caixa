import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { formatBRL, monthKey } from "../lib/utils";
import ParcelamentoForm from "../components/ParcelamentoForm";
import ConfirmDialog from "../components/ConfirmDialog";

export default function ParcelamentosPage({ installmentPlans, transactions, categories, paymentMethods, reloadInstallmentPlans, reloadTransactions }) {
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [filter, setFilter] = useState("todos");

  const enriched = useMemo(() => {
    const hoje = monthKey(new Date().toISOString().slice(0, 10));
    return installmentPlans.map((p) => {
      const parcelas = transactions.filter((t) => t.installment_plan_id === p.id).sort((a, b) => a.parcela_num - b.parcela_num);
      const pagas = parcelas.filter((t) => t.paid !== false).length;
      const finalizado = pagas >= p.total_parcelas;
      const ultimaKey = monthKey(p.last_date_estimated);
      const mesesAteTerminar = (Number(ultimaKey.slice(0, 4)) - Number(hoje.slice(0, 4))) * 12 + (Number(ultimaKey.slice(5, 7)) - Number(hoje.slice(5, 7)));
      const proximo = !finalizado && mesesAteTerminar <= 1;
      const status = finalizado ? "Finalizado" : proximo ? "Próximo de terminar" : "Ativo";
      return { ...p, parcelas, pagas, restantes: p.total_parcelas - pagas, status, mesesAteTerminar };
    }).sort((a, b) => (a.status === "Finalizado") - (b.status === "Finalizado"));
  }, [installmentPlans, transactions]);

  const filtrados = enriched.filter((p) => filter === "todos" ? true : filter === "ativos" ? p.status !== "Finalizado" : p.status === "Finalizado");
  const statusColor = { "Ativo": "var(--ok)", "Próximo de terminar": "var(--warn)", "Finalizado": "var(--muted)" };

  async function togglePaid(t) {
    await supabase.from("transactions").update({ paid: t.paid === false }).eq("id", t.id);
    reloadTransactions();
  }

  async function confirmDeleteNow() {
    // ON DELETE CASCADE já apaga as transações vinculadas automaticamente
    await supabase.from("installment_plans").delete().eq("id", confirmDelete);
    setConfirmDelete(null);
    reloadInstallmentPlans();
    reloadTransactions();
  }

  return (
    <>
      <div className="panel-head" style={{ marginBottom: 16 }}>
        <h1 className="page-title" style={{ marginBottom: 0 }}>Parcelamentos</h1>
        <button className="btn-add" onClick={() => setShowForm(true)}><Plus size={14} /> Novo parcelamento</button>
      </div>

      <div className="month-tabs" style={{ maxWidth: 320 }}>
        {[{ id: "todos", l: "Todos" }, { id: "ativos", l: "Ativos" }, { id: "finalizados", l: "Finalizados" }].map((f) => (
          <button key={f.id} className={`month-tab ${filter === f.id ? "active" : ""}`} onClick={() => setFilter(f.id)}>{f.l}</button>
        ))}
      </div>

      {filtrados.length === 0 ? (
        <div className="panel"><p className="empty-note">Nenhum parcelamento nessa visão ainda.</p></div>
      ) : (
        filtrados.map((p) => (
          <div className="panel" key={p.id}>
            <div className="panel-head">
              <div>
                <div className="display" style={{ fontSize: 15.5, fontWeight: 500 }}>{p.description}</div>
                <div className="empty-note" style={{ marginTop: 3 }}>{p.category} · {formatBRL(p.total_value)} · {p.total_parcelas}x de {formatBRL(p.parcela_value)}</div>
              </div>
              <span style={{ fontSize: 10.5, textTransform: "uppercase", border: "1px solid", borderRadius: 20, padding: "4px 10px", color: statusColor[p.status], borderColor: statusColor[p.status] }}>{p.status}</span>
            </div>

            <div className="factor-bar" style={{ height: 7, marginBottom: 6 }}>
              <div style={{ width: `${(p.pagas / p.total_parcelas) * 100}%`, background: statusColor[p.status] }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, color: "var(--muted)" }}>
              <span>{p.pagas}/{p.total_parcelas} pagas</span>
              <span>Restam {p.restantes} parcela(s)</span>
            </div>

            {p.status === "Próximo de terminar" && (
              <p className="empty-note" style={{ marginTop: 8 }}>Este parcelamento termina {p.mesesAteTerminar <= 0 ? "neste mês" : "no próximo mês"}.</p>
            )}

            <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
              <button className="btn-secondary" onClick={() => setExpandedId(expandedId === p.id ? null : p.id)}>
                {expandedId === p.id ? "Ocultar parcelas" : "Ver parcelas"}
              </button>
              <button className="icon-btn" onClick={() => setConfirmDelete(p.id)}><Trash2 size={14} /></button>
            </div>

            {expandedId === p.id && (
              <div style={{ marginTop: 12, borderTop: "1px solid var(--line)", paddingTop: 6 }}>
                {p.parcelas.map((t) => (
                  <div className="tx-row-full" key={t.id}>
                    <button className={`check-btn ${t.paid !== false ? "checked" : ""}`} onClick={() => togglePaid(t)}>
                      {t.paid !== false && "✓"}
                    </button>
                    <div className="tx-info">
                      <span className="tx-desc">Parcela {t.parcela_num}/{t.parcela_total}</span>
                      <span className="tx-meta">{new Date(t.date + "T00:00:00").toLocaleDateString("pt-BR")}</span>
                    </div>
                    <span className="mono tx-amt neg">{formatBRL(t.amount)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))
      )}

      {showForm && (
        <ParcelamentoForm
          categories={categories} paymentMethods={paymentMethods}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); reloadInstallmentPlans(); reloadTransactions(); }}
        />
      )}
      {confirmDelete && (
        <ConfirmDialog
          message="Tem certeza que deseja excluir este parcelamento? Todas as parcelas — pagas e pendentes — serão removidas."
          onCancel={() => setConfirmDelete(null)}
          onConfirm={confirmDeleteNow}
        />
      )}
    </>
  );
}
