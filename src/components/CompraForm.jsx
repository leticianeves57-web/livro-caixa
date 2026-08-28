import { useState } from "react";
import { X } from "lucide-react";
import { supabase } from "../lib/supabaseClient";

const PRIORIDADES = [{ id: "alta", label: "Alta" }, { id: "media", label: "Média" }, { id: "baixa", label: "Baixa" }];
const STATUS_OPTIONS = [
  { id: "planejado", label: "Planejado" }, { id: "prioridade-alta", label: "Prioridade alta" },
  { id: "comprado", label: "Comprado" }, { id: "cancelado", label: "Cancelado" },
];

export default function CompraForm({ categories, initialData, onClose, onSaved }) {
  const editMode = !!initialData;
  const [product, setProduct] = useState(initialData?.product || "");
  const [category, setCategory] = useState(initialData?.category || categories[0]?.name || "");
  const [estimatedValue, setEstimatedValue] = useState(initialData ? String(initialData.estimated_value) : "");
  const [priority, setPriority] = useState(initialData?.priority || "media");
  const [forecastDate, setForecastDate] = useState(initialData?.forecast_date || "");
  const [status, setStatus] = useState(initialData?.status || "planejado");
  const [note, setNote] = useState(initialData?.note || "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError("");
    if (!product.trim()) { setError("Informe o nome do produto antes de salvar."); return; }
    const val = parseFloat(String(estimatedValue).replace(",", "."));
    if (!estimatedValue || Number.isNaN(val) || val <= 0) { setError("Informe um valor estimado válido, maior que zero."); return; }

    setSaving(true);
    const payload = { product: product.trim(), category, estimated_value: val, priority, forecast_date: forecastDate || null, status, note: note.trim() };
    const { error: err } = editMode
      ? await supabase.from("shopping_list").update(payload).eq("id", initialData.id)
      : await supabase.from("shopping_list").insert(payload);
    setSaving(false);
    if (err) { setError(err.message); return; }
    onSaved();
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3 className="display modal-title">
          {editMode ? "Editar item" : "Nova compra planejada"}
          <button className="icon-btn" onClick={onClose}><X size={18} /></button>
        </h3>
        <form onSubmit={submit}>
          <div className="field">
            <label>Produto</label>
            <input value={product} onChange={(e) => setProduct(e.target.value)} placeholder="Ex: Notebook, Tênis…" autoFocus />
          </div>
          <div className="field-row">
            <div className="field">
              <label>Categoria</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                {categories.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Valor estimado (R$)</label>
              <input inputMode="decimal" value={estimatedValue} onChange={(e) => setEstimatedValue(e.target.value)} placeholder="0,00" />
            </div>
          </div>
          <div className="field-row">
            <div className="field">
              <label>Prioridade</label>
              <select value={priority} onChange={(e) => setPriority(e.target.value)}>
                {PRIORIDADES.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Previsão de compra</label>
              <input type="month" value={forecastDate ? forecastDate.slice(0, 7) : ""} onChange={(e) => setForecastDate(e.target.value ? `${e.target.value}-01` : "")} />
            </div>
          </div>
          <div className="field">
            <label>Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              {STATUS_OPTIONS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Observação (opcional)</label>
            <input value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
          {error && <p className="form-error">{error}</p>}
          <button className="btn-primary" type="submit" disabled={saving}>{saving ? "Salvando…" : editMode ? "Salvar alterações" : "Adicionar à lista"}</button>
        </form>
      </div>
    </div>
  );
}
