import { useMemo, useState } from "react";
import { Receipt, TrendingUp, ArrowUpRight, ArrowDownRight, CalendarDays } from "lucide-react";
import { formatBRL, monthKey, todayStr } from "../lib/utils";
import TransactionForm from "../components/TransactionForm";
import InvestMovementForm from "../components/InvestMovementForm";

export default function DashboardPage({ transactions, categories, paymentMethods, investmentTypes, reloadTransactions, reloadInvestments, setActivePage }) {
  const [showExpense, setShowExpense] = useState(false);
  const [showIncome, setShowIncome] = useState(false);
  const [showInvest, setShowInvest] = useState(false);

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

      <div className="quick-actions">
        <button className="quick-action expense" onClick={() => setShowExpense(true)}>
          <ArrowDownRight size={17} /> Novo gasto
        </button>
        <button className="quick-action income" onClick={() => setShowIncome(true)}>
          <ArrowUpRight size={17} /> Nova entrada
        </button>
        <button className="quick-action invest" onClick={() => setShowInvest(true)}>
          <TrendingUp size={17} /> Investir
        </button>
        <button className="quick-action neutral" onClick={() => setActivePage("gastos")}>
          <CalendarDays size={17} /> Gastos do mês
        </button>
      </div>

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

      {showExpense && (
        <TransactionForm
          categories={categories} paymentMethods={paymentMethods} defaultType="saida"
          onClose={() => setShowExpense(false)}
          onSaved={() => { setShowExpense(false); reloadTransactions(); }}
        />
      )}
      {showIncome && (
        <TransactionForm
          categories={categories} paymentMethods={paymentMethods} defaultType="entrada"
          onClose={() => setShowIncome(false)}
          onSaved={() => { setShowIncome(false); reloadTransactions(); }}
        />
      )}
      {showInvest && (
        <InvestMovementForm
          investmentTypes={investmentTypes}
          onClose={() => setShowInvest(false)}
          onSaved={() => { setShowInvest(false); reloadInvestments(); reloadTransactions(); }}
        />
      )}
    </>
  );
}
