import { useMemo } from "react";
import { AlertTriangle, Info, Sparkles } from "lucide-react";
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { formatBRL, monthKey, todayStr } from "../lib/utils";
import { computeSaudeFinanceira, CLASSIFICACOES } from "../lib/saude";

const MESES_ABREV = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
const PALETTE = ["#2F6B4A","#B0453A","#B8863B","#4C6B8A","#7A4C8A","#8A6B4C","#4C8A7A","#8A4C6B"];

function isPaid(t) { return t.paid !== false; }
function isEvitavel(t) { return t.classification === "evitavel"; }

export default function SaudeFinanceiraPage({ transactions }) {
  const stats = useMemo(() => {
    const currentMonth = monthKey(todayStr());
    const paid = transactions.filter(isPaid);
    const mesAtual = paid.filter((t) => monthKey(t.date) === currentMonth);

    const entradasMes = mesAtual.filter((t) => t.type === "entrada").reduce((s, t) => s + Number(t.amount), 0);
    const saidasMes = mesAtual.filter((t) => t.type === "saida").reduce((s, t) => s + Number(t.amount), 0);
    const gastosFixosMes = mesAtual.filter((t) => t.type === "saida" && t.fixed).reduce((s, t) => s + Number(t.amount), 0);
    const gastosEvitaveisMes = mesAtual.filter((t) => t.type === "saida" && isEvitavel(t)).reduce((s, t) => s + Number(t.amount), 0);
    const saldoMes = entradasMes - saidasMes;

    const saude = computeSaudeFinanceira({ entradas: entradasMes, saidas: saidasMes, gastosFixos: gastosFixosMes, gastosEvitaveis: gastosEvitaveisMes, saldoMes });

    // últimos 6 meses, pro gráfico de barras
    const hoje = new Date();
    const meses = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const doMes = paid.filter((t) => monthKey(t.date) === key);
      meses.push({
        mes: MESES_ABREV[d.getMonth()],
        entradas: doMes.filter((t) => t.type === "entrada").reduce((s, t) => s + Number(t.amount), 0),
        saidas: doMes.filter((t) => t.type === "saida").reduce((s, t) => s + Number(t.amount), 0),
      });
    }

    // gastos por categoria (mês atual)
    const porCategoria = {};
    mesAtual.filter((t) => t.type === "saida").forEach((t) => {
      porCategoria[t.category] = (porCategoria[t.category] || 0) + Number(t.amount);
    });
    const gastosPorCategoria = Object.entries(porCategoria).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

    // classificação
    const classificacaoTotais = CLASSIFICACOES.map((c) => ({
      ...c,
      value: mesAtual.filter((t) => t.type === "saida" && (t.classification || "essencial") === c.id).reduce((s, t) => s + Number(t.amount), 0),
    }));

    // categoria líder + comparação com mês anterior
    const prevDate = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
    const prevKey = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}`;
    const mesAnterior = paid.filter((t) => monthKey(t.date) === prevKey);
    const catAnterior = {};
    mesAnterior.filter((t) => t.type === "saida").forEach((t) => { catAnterior[t.category] = (catAnterior[t.category] || 0) + Number(t.amount); });

    let topCategoria = gastosPorCategoria[0] || null;
    let topCategoriaPct = null;
    if (topCategoria && catAnterior[topCategoria.name] > 0) {
      topCategoriaPct = ((topCategoria.value - catAnterior[topCategoria.name]) / catAnterior[topCategoria.name]) * 100;
    }

    // alertas dinâmicos
    const alerts = [];
    if (entradasMes > 0) {
      const comprometidoPct = Math.round((saidasMes / entradasMes) * 100);
      if (comprometidoPct >= 70) {
        alerts.push({ id: "comprometido", tone: comprometidoPct >= 90 ? "critico" : "atencao", text: `Você já comprometeu ${comprometidoPct}% da sua renda deste mês.` });
      }
    }
    let maiorAlta = null;
    Object.keys(porCategoria).forEach((cat) => {
      const ant = catAnterior[cat];
      if (ant > 0) {
        const pct = ((porCategoria[cat] - ant) / ant) * 100;
        if (pct >= 20 && (!maiorAlta || pct > maiorAlta.pct)) maiorAlta = { cat, pct };
      }
    });
    if (maiorAlta) alerts.push({ id: "categoria-alta", tone: "atencao", text: `Seus gastos com ${maiorAlta.cat} aumentaram ${Math.round(maiorAlta.pct)}% neste mês.` });

    if (topCategoria && saidasMes > 0) {
      const share = (topCategoria.value / saidasMes) * 100;
      if (share >= 15) alerts.push({ id: "categoria-share", tone: "info", text: `A categoria ${topCategoria.name} representa ${Math.round(share)}% das suas despesas neste mês.` });
    }
    if (entradasMes > 0) {
      const poupancaPct = (saldoMes / entradasMes) * 100;
      if (poupancaPct >= 20) alerts.push({ id: "economia-boa", tone: "positivo", text: `Você conseguiu economizar ${Math.round(poupancaPct)}% da sua renda este mês.` });
    }
    if (saldoMes > 50) alerts.push({ id: "disponivel-investir", tone: "positivo", text: `Você possui ${formatBRL(saldoMes)} disponíveis para investir este mês.` });

    // insights de interpretação
    const insights = [];
    if (entradasMes > 0 && saidasMes > 0) insights.push(`Você gastou ${formatBRL(saidasMes)} neste mês, equivalente a ${Math.round((saidasMes / entradasMes) * 100)}% da sua renda.`);
    if (gastosPorCategoria.length > 0) {
      const top3 = gastosPorCategoria.slice(0, 3).map((c) => c.name);
      insights.push(`${top3.length > 1 ? "Os maiores gastos foram" : "O maior gasto foi"} ${top3.length > 1 ? top3.slice(0, -1).join(", ") + " e " + top3[top3.length - 1] : top3[0]}.`);
    }
    if (topCategoria && topCategoriaPct != null) {
      insights.push(`Seu gasto com ${topCategoria.name} ${topCategoriaPct >= 0 ? "aumentou" : "diminuiu"} ${Math.round(Math.abs(topCategoriaPct))}% em relação ao mês anterior.`);
    }
    if (gastosEvitaveisMes > 0) insights.push(`Você poderia economizar aproximadamente ${formatBRL(gastosEvitaveisMes)} reduzindo gastos classificados como evitáveis.`);

    return { entradasMes, saidasMes, saldoMes, saude, meses, gastosPorCategoria, classificacaoTotais, alerts, insights };
  }, [transactions]);

  return (
    <>
      <h1 className="page-title">Saúde Financeira</h1>

      {!stats.saude ? (
        <div className="panel"><p className="empty-note">Registre entradas neste mês para calcular sua pontuação.</p></div>
      ) : (
        <div className="panel health-card">
          <div className="health-gauge">
            <svg viewBox="0 0 130 130" width="120" height="120">
              <circle cx="65" cy="65" r="54" fill="none" stroke="var(--line)" strokeWidth="11" />
              <circle cx="65" cy="65" r="54" fill="none" strokeLinecap="round" stroke={stats.saude.color} strokeWidth="11"
                strokeDasharray={`${(stats.saude.total / 100) * 339.3} 339.3`} transform="rotate(-90 65 65)" />
            </svg>
            <div className="health-gauge-center">
              <div className="mono" style={{ fontSize: 28, fontWeight: 600, color: stats.saude.color }}>{stats.saude.total}</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: stats.saude.color, textTransform: "uppercase" }}>{stats.saude.band}</div>
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 14, marginBottom: 14 }}>{stats.saude.explanation}</p>
            <div className="factors-grid">
              {stats.saude.factors.map((f) => (
                <div key={f.id}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>
                    <span>{f.label}</span><span className="mono">{f.score}/{f.max}</span>
                  </div>
                  <div className="factor-bar"><div style={{ width: `${(f.score / f.max) * 100}%`, background: f.score / f.max < 0.5 ? "var(--bad)" : f.score / f.max < 0.85 ? "var(--warn)" : "var(--ok)" }} /></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {stats.insights.length > 0 && (
        <div className="panel">
          <h3>O que isso significa</h3>
          {stats.insights.map((text, i) => (
            <div className="alert-row tone-info" key={i}><Info size={15} /><span>{text}</span></div>
          ))}
        </div>
      )}

      <div className="panel">
        <h3>Entradas × Saídas — últimos 6 meses</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={stats.meses}>
            <CartesianGrid vertical={false} stroke="#D9D3C1" />
            <XAxis dataKey="mes" tick={{ fontSize: 11.5, fill: "#837D6C" }} axisLine={{ stroke: "#D9D3C1" }} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#837D6C" }} axisLine={false} tickLine={false} width={36} tickFormatter={(v) => v >= 1000 ? `${Math.round(v / 1000)}k` : v} />
            <Tooltip formatter={(v) => formatBRL(v)} contentStyle={{ fontSize: 12, borderRadius: 6, borderColor: "#D9D3C1" }} />
            <Bar dataKey="entradas" name="Entradas" fill="#2F6B4A" radius={[3, 3, 0, 0]} maxBarSize={14} />
            <Bar dataKey="saidas" name="Saídas" fill="#B0453A" radius={[3, 3, 0, 0]} maxBarSize={14} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="panel">
        <h3>Gastos por categoria (mês atual)</h3>
        {stats.gastosPorCategoria.length === 0 ? (
          <p className="empty-note">Nenhuma saída registrada neste mês ainda.</p>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={stats.gastosPorCategoria} dataKey="value" nameKey="name" innerRadius={50} outerRadius={78} paddingAngle={2}>
                  {stats.gastosPorCategoria.map((entry, i) => <Cell key={entry.name} fill={PALETTE[i % PALETTE.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => formatBRL(v)} contentStyle={{ fontSize: 12, borderRadius: 6, borderColor: "#D9D3C1" }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="legend">
              {stats.gastosPorCategoria.map((c, i) => (
                <div className="legend-item" key={c.name}>
                  <span className="dot" style={{ background: PALETTE[i % PALETTE.length] }} /> {c.name}
                  <b className="mono">{formatBRL(c.value)}</b>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="panel">
        <h3>Classificação de gastos</h3>
        <div className="class-grid">
          {stats.classificacaoTotais.map((c) => (
            <div className="class-card" key={c.id}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--muted)", marginBottom: 8 }}>
                <span className="dot" style={{ background: c.color }} /> {c.label}
              </div>
              <div className="mono" style={{ fontSize: 17, fontWeight: 500 }}>{formatBRL(c.value)}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="panel">
        <h3>Alertas financeiros</h3>
        {stats.alerts.length === 0 ? (
          <p className="empty-note">Nenhum alerta no momento — seus indicadores estão dentro do esperado.</p>
        ) : (
          stats.alerts.map((a) => (
            <div className={`alert-row tone-${a.tone}`} key={a.id}>
              {a.tone === "positivo" ? <Sparkles size={15} /> : a.tone === "info" ? <Info size={15} /> : <AlertTriangle size={15} />}
              <span>{a.text}</span>
            </div>
          ))
        )}
      </div>
    </>
  );
}
