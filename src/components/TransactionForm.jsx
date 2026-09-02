import { useState } from "react";
import { X } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { addMonths, todayStr } from "../lib/utils";

const GERACAO_MESES_ADIANTE = 24;

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
  const [repeticao, setRepeticao] = useState("nenhuma");
  const [endDate, setEndDate] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError("");
    if (!description.trim()) { setError("Descreva o lançamento antes de salvar."); return; }
    const val = parseFloat(String(amount).replace(",", "."));
    if (!amount || Number.isNaN(val) || val <= 0) { setError("Informe um valor válido, maior que zero."); return; }
    if (!date) { setError("Escolha uma data."); return; }
    if (repeticao === "recorrente" && endDate && endDate < date) { setError("A data de término não pode ser antes da data de início."); return; }

    setSaving(true);

    if (!editMode && repeticao === "recorrente") {
      const { data: serie, error: serieErr } = await supabase.from("series").insert({
        description: description.trim(), amount: val, category, type,
        payment_method: paymentMethod, classification: type === "saida" ? classification : null,
        start_date: date, end_date: endDate || null, status: "ativa",
      }).select().single();
      if (serieErr) { setSaving(false); setError(serieErr.message); return; }

      const limite = endDate && endDate < addMonths(date, GERACAO_MESES_ADIANTE) ? endDate : addMonths(date, GERACAO_MESES_ADIANTE);
      const rows = [];
      let i = 0;
      while (true) {
        const d = addMonths(date, i);
        if (d > limite) break;
        rows.push({
          type, description: description.trim(), category, amount: val, date: d,
          payment_method: paymentMethod, fixed: true, paid: i === 0 ? paid : false, note: note.trim(),
          classification: type === "saida" ? classification : null, series_id: serie.id,
        });
        i++;
      }
      const { error: txErr } = await supabase.from("transactions").insert(rows);
      setSaving(false);
      if (txErr) { setError(txErr.message); return; }
      onSaved();
      return;
    }

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

          {!editMode && (
            <>
              <div className="field">
                <label>Repetição</label>
                <select value={repeticao} onChange={(e) => setRepeticao(e.target.value)}>
                  <option value="nenhuma">Lançamento único</option>
                  <option value="recorrente">Recorrente (todo mês)</option>
                </select>
              </div>
              {repeticao === "recorrente" && (
                <div className="field">
                  <label>Data de término (opcional)</label>
                  <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                  <p style={{ fontSize: 11, color: "var(--muted)", margin: "5px 0 0 0" }}>Deixe em branco para gerar sem data final definida.</p>
                </div>
              )}
            </>
          )}

          {error && <p className="form-error">{error}</p>}
          <button className="btn-primary" type="submit" disabled={saving}>
            {saving ? "Salvando…" : editMode ? "Salvar alterações" : "Salvar lançamento"}
          </button>
        </form>
      </div>
    </div>
  );
}

