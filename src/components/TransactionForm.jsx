import { useState } from "react";
import { X } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { todayStr } from "../lib/utils";

export default function TransactionForm({ categories, paymentMethods, initialData, defaultType, onClose, onSaved }) {
  const editMode = !!initialData;
  const [type, setType] = useState(initialData?.type || defaultType || "saida");
  const [description, setDescription] = useState(initialData?.description || "");
  const [category, setCategory] = useState(initialData?.category || categories[0]?.name || "");
  const [amount, setAmount] = useState(initialData ? String(initialData.amount) : "");
  const [date, setDate] = useState(initialData?.date || todayStr());
  const [paymentMethod, setPaymentMethod] = useState(initialData?.payment_method || paymentMethods[0]?.name || "");
  const [fixed, setFixed] = useState(initialData?.fixed || false);
  const [classification, setClassification] = useState(initialData?.classification || "essencial");
  const [paid, setPaid] = useState(initialData ? initialData.paid !== false : true);
  const [note, setNote] = useState(initialData?.note || "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError("");
    if (!description.trim()) { setError("Descreva o lançamento antes de salvar."); return; }
    const val = parseFloat(String(amount).replace(",", "."));
    if (!amount || Number.isNaN(val) || val <= 0) { setError("Informe um valor válido, maior que zero."); return; }
    if (!date) { setError("Escolha uma data."); return; }

    setSaving(true);
    const payload = {
      type, description: description.trim(), category, amount: val, date,
      payment_method: paymentMethod, fixed, paid, note: note.trim(),
      classification: type === "saida" ? classification : null,
    };
    const { error: err } = editMode
      ? await supabase.from("transactions").update(payload).eq("id", initialData.id)
      : await supabase.from("transactions").insert(payload);
    setSaving(false);
    if (err) { setError(err.message); return; }
    onSaved();
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3 className="display modal-title">
          {editMode ? "Editar lançamento" : "Novo lançamento"}
          <button className="icon-btn" onClick={onClose}><X size={18} /></button>
        </h3>
        <form onSubmit={submit}>
          <div className="type-row">
            <button type="button" className={`type-btn ${type === "entrada" ? "active entrada" : ""}`} onClick={() => setType("entrada")}>Entrada</button>
            <button type="button" className={`type-btn ${type === "saida" ? "active saida" : ""}`} onClick={() => setType("saida")}>Saída</button>
          </div>
          <div className="field">
            <label>Descrição</label>
            <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ex: Mercado, Salário…" autoFocus />
          </div>
          <div className="field-row">
            <div className="field">
              <label>Categoria</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                {categories.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Valor (R$)</label>
              <input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0,00" />
            </div>
          </div>
          <div className="field-row">
            <div className="field">
              <label>Forma de pagamento</label>
              <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                {paymentMethods.map((p) => <option key={p.id} value={p.name}>{p.name}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Data</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>
          <div className="field">
            <label className="checkbox-label">
              <input type="checkbox" checked={fixed} onChange={(e) => setFixed(e.target.checked)} />
              É uma conta ou entrada fixa
            </label>
          </div>
          {type === "saida" && (
            <div className="field">
              <label>Classificação do gasto</label>
              <select value={classification} onChange={(e) => setClassification(e.target.value)}>
                <option value="essencial">Essencial</option>
                <option value="importante">Importante</option>
                <option value="nao-essencial">Não essencial</option>
                <option value="evitavel">Evitável</option>
              </select>
            </div>
          )}
          <div className="field">
            <label className="checkbox-label">
              <input type="checkbox" checked={paid} onChange={(e) => setPaid(e.target.checked)} />
              {type === "entrada" ? "Já foi recebido" : "Já foi pago"}
            </label>
          </div>
          <div className="field">
            <label>Observação (opcional)</label>
            <input value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
          {error && <p className="form-error">{error}</p>}
          <button className="btn-primary" type="submit" disabled={saving}>
            {saving ? "Salvando…" : editMode ? "Salvar alterações" : "Salvar lançamento"}
          </button>
        </form>
      </div>
    </div>
  );
}
