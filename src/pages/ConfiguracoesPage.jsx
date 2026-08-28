import { useState } from "react";
import { Plus, Pencil, Trash2, Check, X } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import ConfirmDialog from "../components/ConfirmDialog";

function ListSection({ title, table, items, reload, placeholder }) {
  const [novo, setNovo] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [confirmId, setConfirmId] = useState(null);
  const [error, setError] = useState("");

  async function add(e) {
    e.preventDefault();
    setError("");
    if (!novo.trim()) return;
    const { error: err } = await supabase.from(table).insert({ name: novo.trim() });
    if (err) { setError(err.message.includes("duplicate") ? "Esse item já existe." : err.message); return; }
    setNovo("");
    reload();
  }

  async function rename(id) {
    if (!editValue.trim()) { setEditingId(null); return; }
    await supabase.from(table).update({ name: editValue.trim() }).eq("id", id);
    setEditingId(null);
    reload();
  }

  async function remove() {
    await supabase.from(table).delete().eq("id", confirmId);
    setConfirmId(null);
    reload();
  }

  return (
    <div className="panel">
      <h3>{title}</h3>
      {error && <p className="form-error">{error}</p>}
      <div className="list">
        {items.map((it) => (
          <div className="list-row" key={it.id}>
            {editingId === it.id ? (
              <form onSubmit={(e) => { e.preventDefault(); rename(it.id); }} style={{ display: "flex", gap: 6, flex: 1 }}>
                <input value={editValue} onChange={(e) => setEditValue(e.target.value)} autoFocus style={{ flex: 1, padding: "5px 8px" }} />
                <button type="submit" className="icon-btn"><Check size={14} /></button>
                <button type="button" className="icon-btn" onClick={() => setEditingId(null)}><X size={14} /></button>
              </form>
            ) : (
              <>
                <span>{it.name}</span>
                <div style={{ display: "flex", gap: 2 }}>
                  <button className="icon-btn" onClick={() => { setEditingId(it.id); setEditValue(it.name); }}><Pencil size={13} /></button>
                  <button className="icon-btn" onClick={() => setConfirmId(it.id)}><Trash2 size={13} /></button>
                </div>
              </>
            )}
          </div>
        ))}
        {items.length === 0 && <p className="empty-note">Nenhum item cadastrado ainda.</p>}
      </div>
      <form onSubmit={add} className="add-row">
        <input value={novo} onChange={(e) => setNovo(e.target.value)} placeholder={placeholder} />
        <button className="btn-add" type="submit"><Plus size={15} /></button>
      </form>

      {confirmId && (
        <ConfirmDialog
          message={`Remover "${items.find((i) => i.id === confirmId)?.name}"? Lançamentos já feitos com esse item continuam intactos.`}
          onCancel={() => setConfirmId(null)}
          onConfirm={remove}
        />
      )}
    </div>
  );
}

export default function ConfiguracoesPage({ categories, paymentMethods, reloadCategories, reloadPaymentMethods }) {
  return (
    <>
      <h1 className="page-title">Configurações</h1>
      <ListSection title="Categorias" table="categories" items={categories} reload={reloadCategories} placeholder="Nova categoria" />
      <ListSection title="Formas de pagamento" table="payment_methods" items={paymentMethods} reload={reloadPaymentMethods} placeholder="Nova forma de pagamento" />
    </>
  );
}
