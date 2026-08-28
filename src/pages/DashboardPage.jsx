import { useMemo } from "react";
import { formatBRL, monthKey, todayStr } from "../lib/utils";

export default function DashboardPage({ transactions }) {
  const stats = useMemo(() => {
    const currentMonth = monthKey(todayStr());
    const paid = transactions.filter((t) => t.paid !== false);
    const mesAtual = paid.filter((t) => monthKey(t.date) === currentMonth);
    const entradasMes = mesAtual.filter((t) => t.type === "entrada").reduce((s, t) => s + Number(t.amount), 0);
    const saidasMes = mesAtual.filter((t) => t.type === "saida").reduce((s, t) => s + Number(t.amount), 0);
    const saldoAcumulado = paid.reduce((s, t) => s + (t.type === "entrada" ? Number(t.amount) : -Number(t.amount)), 0);
    const pendentes = transactions.filter((t) => t.paid === false).length;
    return { entradasMes, saidasMes, saldoMes: entradasMes - saidasMes, saldoAcumulado, pendentes };
  }, [transactions]);

  return (
    <>
      <h1 className="page-title">Olá!</h1>
      <p className="page-sub">Como estão suas finanças hoje?</p>

      <div className="mini-cards">
        <div className="mini-card top-ok">
          <div className="lbl">Entrou no mês</div>
          <div className="val pos mono">{formatBRL(stats.entradasMes)}</div>
        </div>
        <div className="mini-card top-bad">
          <div className="lbl">Saiu no mês</div>
          <div className="val neg mono">{formatBRL(stats.saidasMes)}</div>
        </div>
        <div className="mini-card">
          <div className="lbl">Saldo do mês</div>
          <div className={`val mono ${stats.saldoMes >= 0 ? "pos" : "neg"}`}>{formatBRL(stats.saldoMes)}</div>
        </div>
      </div>

      <div className="panel">
        <h3>Saldo acumulado</h3>
        <div className="hero-value mono">{formatBRL(stats.saldoAcumulado)}</div>
        {stats.pendentes > 0 && (
          <p className="empty-note" style={{ marginTop: 10 }}>
            Você tem {stats.pendentes} lançamento(s) pendente(s) — ainda não entram nesse saldo.
          </p>
        )}
      </div>

      <p className="empty-note" style={{ textAlign: "center" }}>
        Fase 2 em andamento — Movimentações e Gastos já funcionam de verdade.
        Saúde Financeira, gráficos, Investimentos, Reserva, Parcelamentos e Lista de Compras entram nas próximas fases.
      </p>
    </>
  );
}
