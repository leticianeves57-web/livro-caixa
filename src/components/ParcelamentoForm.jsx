import { useState } from "react";
import { X } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { addMonths, formatBRL, todayStr } from "../lib/utils";

export default function ParcelamentoForm({ categories, paymentMethods, onClose, onSaved }) {
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(categories[0]?.name || "");
  const [totalValue, setTotalValue] = useState("");
  const [totalParcelas, setTotalParcelas] = useState(2);
  const [firstDate, setFirstDate] = useState(todayStr());
  const [paymentMethod, setPaymentMethod] = useState(paymentMethods[0]?.name || "");
  const [account, setAccount] = useState("");
  const [note, setNote] = useState("");
  const [firstPaid, setFirstPaid] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const totalNum = parseFloat(String(totalValue).replace(",", ".")) || 0;
  const n = Math.max(2, Number(totalParcelas) || 2);
  const parcelaValue = totalNum > 0 ? Math.round((totalNum / n) * 100) / 100 : 0;
  const lastDateEstimated = addMonths(firstDate, n - 1);

  async function submit(e) {
    e.preventDefault();
    setError("");
    if (!description.trim()) { setError("Descreva a compra antes de salvar."); return; }
    if (!totalValue || Number.isNaN(totalNum) || totalNum <= 0) { setError("Informe um valor total válido, maior que zero."); return; }
    const parcelasNum = Number(totalParcelas);
    if (!Number.isInteger(parcelasNum) || parcelasNum < 2 || parcelasNum > 60) { setError("Quantidade de parcelas inválida — use um número entre 2 e 60."); return; }
    if (!firstDate) { setError("Escolha a data da primeira parcela."); return; }

    setSaving(true);
    const { data: plan, error: planErr } = await supabase.from("installment_plans").insert({
      description: description.trim(), category, total_value: totalNum, total_parcelas: n,
      parcela_value: parcelaValue, first_date: firstDate, last_date_estimated: lastDateEstimated,
      payment_method: paymentMethod, account: account.trim(), note: note.trim(),
    }).select().single();
    if (planErr) { setSaving(false); setError(planErr.message); return; }

    const rows = [];
    for (let i = 0; i < n; i++) {
      rows.push({
        type: "saida", description: description.trim(), category, amount: parcelaValue,
        date: addMonths(firstDate, i), payment_method: paymentMethod, account: account.trim(),
        fixed: false, classification: "essencial", note: note.trim(),
        paid: i === 0 ? firstPaid : false,
        installment_plan_id: plan.id, parcela_num: i + 1, parcela_total: n,
      });
    }
    const { error: txErr } = await supabase.from("transactions").insert(rows);
    setSaving(false);
    if (txErr) { setError(txErr.message); return; }
    onSaved();
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3 className="display modal-title">
          Novo parcelamento
          <button className="icon-btn" onClick={onClose}><X size={18} /></button>
        </h3>
        <form onSubmit={submit}>
          <div className="field">
            <label>Descrição da compra</label>
            <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ex: Notebook…" autoFocus />
          </div>
          <div className="field">
            <label>Categoria</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              {categories.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          </div>
          <div className="field-row">
            <div className="field">
              <label>Valor total (R$)</label>
              <input inputMode="decimal" value={totalValue} onChange={(e) => setTotalValue(e.target.value)} placeholder="0,00" />
            </div>
            <div className="field">
              <label>Número de parcelas</label>
              <input type="number" min={2} max={60} value={totalParcelas} onChange={(e) => setTotalParcelas(e.target.value)} />
            </div>
          </div>
          <div className="field-row">
            <div className="field">
              <label>Valor da parcela</label>
              <input value={parcelaValue ? formatBRL(parcelaValue) : "—"} readOnly style={{ background: "var(--paper)", color: "var(--muted)" }} />
            </div>
            <div className="field">
              <label>Data da 1ª parcela</label>
              <input type="date" value={firstDate} onChange={(e) => setFirstDate(e.target.value)} />
            </div>
          </div>
          <div className="field">
            <label>Previsão da última parcela</label>
            <input value={new Date(lastDateEstimated + "T00:00:00").toLocaleDateString("pt-BR")} readOnly style={{ background: "var(--paper)", color: "var(--muted)" }} />
          </div>
          <div className="field-row">
            <div className="field">
              <label>Forma de pagamento</label>
              <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                {paymentMethods.map((p) => <option key={p.id} value={p.name}>{p.name}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Cartão/conta</label>
              <input value={account} onChange={(e) => setAccount(e.target.value)} placeholder="Ex: Cartão Nubank" />
            </div>
          </div>
          <div className="field">
            <label>Observação (opcional)</label>
            <input value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
          <div className="field">
            <label className="checkbox-label">
              <input type="checkbox" checked={firstPaid} onChange={(e) => setFirstPaid(e.target.checked)} />
              A 1ª parcela já foi paga
            </label>
          </div>
          {error && <p className="form-error">{error}</p>}
          <button className="btn-primary" type="submit" disabled={saving}>{saving ? "Salvando…" : "Salvar parcelamento"}</button>
        </form>
      </div>
    </div>
  );
}
