import { useState } from "react";
import { X } from "lucide-react";
import { supabase } from "../lib/supabaseClient";

export default function GoalForm({ session, currentGoal, onClose, onSaved }) {
  const [goal, setGoal] = useState(currentGoal ? String(currentGoal) : "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError("");
    const val = parseFloat(String(goal).replace(",", "."));
    if (goal === "" || Number.isNaN(val) || val < 0) { setError("Informe um valor de meta válido (0 ou mais)."); return; }
    setSaving(true);
    const { error: err } = await supabase.from("user_settings").update({ reserve_goal: val }).eq("user_id", session.user.id);
    setSaving(false);
    if (err) { setError(err.message); return; }
    onSaved();
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 360 }} onClick={(e) => e.stopPropagation()}>
        <h3 className="display modal-title">
          Meta da reserva
          <button className="icon-btn" onClick={onClose}><X size={18} /></button>
        </h3>
        <form onSubmit={submit}>
          <div className="field">
            <label>Valor da meta (R$)</label>
            <input inputMode="decimal" value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="Ex: 30000" autoFocus />
          </div>
          {error && <p className="form-error">{error}</p>}
          <button className="btn-primary" type="submit" disabled={saving}>{saving ? "Salvando…" : "Salvar meta"}</button>
        </form>
      </div>
    </div>
  );
}
