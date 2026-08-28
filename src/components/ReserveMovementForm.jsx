import { useState } from "react";
import { X } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { todayStr } from "../lib/utils";

export default function ReserveMovementForm({ initialData, onClose, onSaved }) {
  const editMode = !!initialData;
  const [type, setType] = useState(initialData?.type || "deposito");
  const [amount, setAmount] = useState(initialData ? String(initialData.amount) : "");
  const [date, setDate] = useState(initialData?.date || todayStr());
  const [institution, setInstitution] = useState(initialData?.institution || "");
  const [note, setNote] = useState(initialData?.note || "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError("");
    const val = parseFloat(String(amount).replace(",", "."));
    if (!amount || Number.isNaN(val) || val <= 0) { setError("Informe um valor válido, maior que zero."); return; }
    if (!date) { setError("Escolha uma data."); return; }

    setSaving(true);
    if (editMode) {
      const { error: err } = await supabase.from("reserve_movements")
        .update({ type, amount: val, date, institution: institution.trim(), note: note.trim() })
        .eq("id", initialData.id);
      if (err) { setSaving(false); setError(err.message); return; }
      if (initialData.linked_transaction_id) {
        await supabase.from("transactions").update({
          type: type === "deposito" ? "saida" : "entrada", amount: val, date,
        }).eq("id", initialData.linked_transaction_id);
      }
    } else {
      const { data: txData, error: txErr } = await supabase.from("transactions").insert({
        type: type === "deposito" ? "saida" : "entrada",
        description: "Reserva de emergência", category: "Reserva", amount: val, date,
        paid: true, fixed: false, is_patrimonio: true,
      }).select().single();
      if (txErr) { setSaving(false); setError(txErr.message); return; }

      const { error: err } = await supabase.from("reserve_movements").insert({
        type, amount: val, date, institution: institution.trim(), note: note.trim(), linked_transaction_id: txData.id,
      });
      if (err) { setSaving(false); setError(err.message); return; }
    }
    setSaving(false);
    onSaved();
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3 className="display modal-title">
          {editMode ? "Editar movimentação" : "Movimentação da reserva"}
          <button className="icon-btn" onClick={onClose}><X size={18} /></button>
        </h3>
        <form onSubmit={submit}>
          <div className="type-row">
            <button type="button" className={`type-btn ${type === "deposito" ? "active entrada" : ""}`} onClick={() => setType("deposito")}>Depósito</button>
            <button type="button" className={`type-btn ${type === "saque" ? "active saida" : ""}`} onClick={() => setType("saque")}>Saque</button>
          </div>
          <div className="field-row">
            <div className="field">
              <label>Valor (R$)</label>
              <input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0,00" />
            </div>
            <div className="field">
              <label>Data</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>
          <div className="field">
            <label>Instituição</label>
            <input value={institution} onChange={(e) => setInstitution(e.target.value)} placeholder="Ex: Nubank…" />
          </div>
          <div className="field">
            <label>Observação (opcional)</label>
            <input value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
          {error && <p className="form-error">{error}</p>}
          <button className="btn-primary" type="submit" disabled={saving}>{saving ? "Salvando…" : editMode ? "Salvar alterações" : "Salvar movimentação"}</button>
        </form>
      </div>
    </div>
  );
}
