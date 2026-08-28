import { useMemo, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { formatBRL, monthKey, todayStr } from "../lib/utils";
import CompraForm from "../components/CompraForm";
import ConfirmDialog from "../components/ConfirmDialog";

const PRIORIDADE_COR = { alta: "#B0453A", media: "#B8863B", baixa: "#4C6B8A" };
const PRIORIDADES_LABEL = { alta: "Alta", media: "Média", baixa: "Baixa" };
const STATUS_LABEL = { planejado: "Planejado", "prioridade-alta": "Prioridade alta", comprado: "Comprado", cancelado: "Cancelado" };

export default function ListaComprasPage({ shoppingList, categories, reloadShoppingList }) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [filter, setFilter] = useState("ativos");

  const stats = useMemo(() => {
    const hoje = monthKey(todayStr());
    const ativos = shoppingList.filter((c) => c.status !== "comprado" && c.status !== "cancelado");
    const total = ativos.reduce((s, c) => s + Number(c.estimated_value), 0);
    const esteMes = ativos.filter((c) => c.forecast_date && monthKey(c.forecast_date) === hoje);
    const proximos = ativos.filter((c) => c.forecast_date && monthKey(c.forecast_date) > hoje);
    const altaPrioridade = ativos.filter((c) => c.priority === "alta");
    return { total, esteMes, proximos, altaPrioridade };
  }, [shoppingList]);

  const filtrados = shoppingList.filter((c) => {
    if (filter === "todos") return true;
    if (filter === "ativos") return c.status !== "comprado" && c.status !== "cancelado";
    if (filter === "comprados") return c.status === "comprado";
    if (filter === "cancelados") return c.status === "cancelado";
    return true;
  }).sort((a, b) => ({ alta: 0, media: 1, baixa: 2 }[a.priority] ?? 3) - ({ alta: 0, media: 1, baixa: 2 }[b.priority] ?? 3));

  async function quickStatus(id, status) {
    await supabase.from("shopping_list").update({ status }).eq("id", id);
    reloadShoppingList();
  }

  async function confirmDeleteNow() {
    await supabase.from("shopping_list").delete().eq("id", confirmDelete);
    setConfirmDelete(null);
    reloadShoppingList();
  }

  return (
    <>
      <div className="panel-head" style={{ marginBottom: 16 }}>
        <h1 className="page-title" style={{ marginBottom: 0 }}>Lista de Compras</h1>
        <button className="btn-add" onClick={() => setShowForm(true)}><Plus size={14} /> Nova compra</button>
      </div>

      <div className="panel" style={{ marginBottom: 14 }}>
        <div className="empty-note" style={{ fontSize: 11.5, textTransform: "uppercase", marginBottom: 6 }}>Total planejado</div>
        <div className="hero-value mono">{formatBRL(stats.total)}</div>
      </div>

      <div className="mini-cards">
        <div className="mini-card">
          <div className="lbl">Este mês</div>
          <div className="val mono">{stats.esteMes.length}</div>
          <div className="empty-note">{formatBRL(stats.esteMes.reduce((s, c) => s + Number(c.estimated_value), 0))}</div>
        </div>
        <div className="mini-card">
          <div className="lbl">Próximos meses</div>
          <div className="val mono">{stats.proximos.length}</div>
          <div className="empty-note">{formatBRL(stats.proximos.reduce((s, c) => s + Number(c.estimated_value), 0))}</div>
        </div>
        <div className="mini-card top-bad">
          <div className="lbl">Alta prioridade</div>
          <div className="val mono">{stats.altaPrioridade.length}</div>
          <div className="empty-note">{formatBRL(stats.altaPrioridade.reduce((s, c) => s + Number(c.estimated_value), 0))}</div>
        </div>
      </div>

      <div className="month-tabs" style={{ maxWidth: 420 }}>
        {[{ id: "ativos", l: "Ativos" }, { id: "todos", l: "Todos" }, { id: "comprados", l: "Comprados" }, { id: "cancelados", l: "Cancelados" }].map((f) => (
          <button key={f.id} className={`month-tab ${filter === f.id ? "active" : ""}`} onClick={() => setFilter(f.id)}>{f.l}</button>
        ))}
      </div>

      <div className="panel">
        {filtrados.length === 0 ? (
          <p className="empty-note">Nada por aqui ainda.</p>
        ) : (
          filtrados.map((c) => (
            <div className="tx-row-full" key={c.id}>
              <div className="tx-info">
                <span className="tx-desc">{c.product}</span>
                <span className="tx-meta">
                  {c.category}{c.forecast_date ? ` · previsto ${new Date(c.forecast_date + "T00:00:00").toLocaleDateString("pt-BR", { month: "short", year: "numeric" })}` : ""}
                </span>
                <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                  <span style={{ fontSize: 10, textTransform: "uppercase", border: "1px solid", borderRadius: 20, padding: "2px 8px", color: PRIORIDADE_COR[c.priority], borderColor: PRIORIDADE_COR[c.priority] }}>
                    {PRIORIDADES_LABEL[c.priority]}
                  </span>
                  <select className="status-select" value={c.status} onChange={(e) => quickStatus(c.id, e.target.value)}>
                    {Object.entries(STATUS_LABEL).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
                  </select>
                </div>
              </div>
              <span className="mono tx-amt">{formatBRL(c.estimated_value)}</span>
              <div className="tx-actions">
                <button className="icon-btn" onClick={() => setEditing(c)}><Pencil size={14} /></button>
                <button className="icon-btn" onClick={() => setConfirmDelete(c.id)}><Trash2 size={14} /></button>
              </div>
            </div>
          ))
        )}
      </div>

      {showForm && <CompraForm categories={categories} onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); reloadShoppingList(); }} />}
      {editing && <CompraForm categories={categories} initialData={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); reloadShoppingList(); }} />}
      {confirmDelete && (
        <ConfirmDialog message="Tem certeza que deseja remover este item da lista de compras?" onCancel={() => setConfirmDelete(null)} onConfirm={confirmDeleteNow} />
      )}
    </>
  );
}
