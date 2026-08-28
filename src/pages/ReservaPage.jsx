import { useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Target } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { formatBRL, monthKey, todayStr } from "../lib/utils";
import ReserveMovementForm from "../components/ReserveMovementForm";
import GoalForm from "../components/GoalForm";
import ConfirmDialog from "../components/ConfirmDialog";

export default function ReservaPage({ session, reserveMovements, settings, reloadReserve, reloadTransactions, reloadSettings }) {
  const [showForm, setShowForm] = useState(false);
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const stats = useMemo(() => {
    const net = (arr) => arr.reduce((s, m) => s + (m.type === "deposito" ? Number(m.amount) : -Number(m.amount)), 0);
    const currentMonth = monthKey(todayStr());
    const currentYear = currentMonth.slice(0, 4);
    const total = net(reserveMovements);
    const meta = Number(settings?.reserve_goal) || 0;
    const progresso = meta > 0 ? Math.min(100, Math.max(0, (total / meta) * 100)) : null;
    return {
      total, meta, progresso,
      falta: meta > 0 ? Math.max(0, meta - total) : null,
      noAno: net(reserveMovements.filter((m) => m.date.slice(0, 4) === currentYear)),
      noMes: net(reserveMovements.filter((m) => monthKey(m.date) === currentMonth)),
    };
  }, [reserveMovements, settings]);

  async function handleSaved() {
    setShowForm(false);
    setEditing(null);
    reloadReserve();
    reloadTransactions();
  }

  async function confirmDeleteNow() {
    const mov = reserveMovements.find((m) => m.id === confirmDelete);
    if (mov?.linked_transaction_id) {
      await supabase.from("transactions").delete().eq("id", mov.linked_transaction_id);
    }
    await supabase.from("reserve_movements").delete().eq("id", confirmDelete);
    setConfirmDelete(null);
    reloadReserve();
    reloadTransactions();
  }

  return (
    <>
      <div className="panel-head" style={{ marginBottom: 16 }}>
        <h1 className="page-title" style={{ marginBottom: 0 }}>Reserva de Emergência</h1>
        <button className="btn-add" onClick={() => setShowForm(true)}><Plus size={14} /> Novo</button>
      </div>

      <div className="mini-cards" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
        <div className="mini-card"><div className="lbl">Total da reserva</div><div className="val mono" style={{ color: "var(--reserve)" }}>{formatBRL(stats.total)}</div></div>
        <div className="mini-card"><div className="lbl">Guardado no mês</div><div className="val mono" style={{ color: "var(--reserve)" }}>{formatBRL(stats.noMes)}</div></div>
        <div className="mini-card"><div className="lbl">Guardado no ano</div><div className="val mono" style={{ color: "var(--reserve)" }}>{formatBRL(stats.noAno)}</div></div>
        <div className="mini-card"><div className="lbl">Meta</div><div className="val mono">{stats.meta > 0 ? formatBRL(stats.meta) : "—"}</div></div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <h3>Meta de reserva</h3>
          <button className="btn-secondary" onClick={() => setShowGoalForm(true)}><Target size={13} style={{ marginRight: 5, verticalAlign: -2 }} />{stats.meta > 0 ? "Editar meta" : "Definir meta"}</button>
        </div>
        {stats.meta > 0 ? (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 6 }}>
              <span className="mono">{formatBRL(stats.total)} / {formatBRL(stats.meta)}</span>
              <b>{Math.round(stats.progresso)}%</b>
            </div>
            <div className="factor-bar" style={{ height: 9 }}><div style={{ width: `${stats.progresso}%`, background: "var(--reserve)" }} /></div>
            <p className="empty-note" style={{ marginTop: 12 }}>Faltam <b className="mono">{formatBRL(stats.falta)}</b> para atingir a meta.</p>
          </>
        ) : (
          <p className="empty-note">Você ainda não definiu uma meta.</p>
        )}
      </div>

      <div className="panel">
        <h3>Movimentações</h3>
        {reserveMovements.length === 0 ? (
          <p className="empty-note">Nenhuma movimentação registrada ainda.</p>
        ) : (
          [...reserveMovements].sort((a, b) => (a.date < b.date ? 1 : -1)).map((m) => (
            <div className="tx-row-full" key={m.id}>
              <div className="tx-info">
                <span className="tx-desc">{m.institution || "Reserva de emergência"}</span>
                <span className="tx-meta">{new Date(m.date + "T00:00:00").toLocaleDateString("pt-BR")} · {m.type === "deposito" ? "Depósito" : "Saque"}</span>
              </div>
              <span className={`mono tx-amt ${m.type === "deposito" ? "pos" : "neg"}`}>{formatBRL(m.amount)}</span>
              <div className="tx-actions">
                <button className="icon-btn" onClick={() => setEditing(m)}><Pencil size={14} /></button>
                <button className="icon-btn" onClick={() => setConfirmDelete(m.id)}><Trash2 size={14} /></button>
              </div>
            </div>
          ))
        )}
      </div>

      {showForm && <ReserveMovementForm onClose={() => setShowForm(false)} onSaved={handleSaved} />}
      {editing && <ReserveMovementForm initialData={editing} onClose={() => setEditing(null)} onSaved={handleSaved} />}
      {showGoalForm && (
        <GoalForm session={session} currentGoal={settings?.reserve_goal} onClose={() => setShowGoalForm(false)} onSaved={() => { setShowGoalForm(false); reloadSettings(); }} />
      )}
      {confirmDelete && (
        <ConfirmDialog
          message="Tem certeza que deseja excluir esta movimentação da reserva?"
          onCancel={() => setConfirmDelete(null)}
          onConfirm={confirmDeleteNow}
        />
      )}
    </>
  );
}
