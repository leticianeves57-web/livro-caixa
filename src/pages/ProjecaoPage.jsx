import { useMemo } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { formatBRL, monthKey } from "../lib/utils";

const MESES_FULL = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

export default function ProjecaoPage({ transactions }) {
  const meses = useMemo(() => {
    const hoje = new Date();
    const inicioMesAtual = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const inicioMesAtualStr = `${inicioMesAtual.getFullYear()}-${String(inicioMesAtual.getMonth() + 1).padStart(2, "0")}-01`;

    // saldo real (só pago) até o início deste mês — ponto de partida da projeção
    const baseline = transactions
      .filter((t) => t.paid !== false && t.date < inicioMesAtualStr)
      .reduce((s, t) => s + (t.type === "entrada" ? Number(t.amount) : -Number(t.amount)), 0);

    let acumulado = baseline;
    const resultado = [];
    for (let i = 0; i < 6; i++) {
      const d = new Date(hoje.getFullYear(), hoje.getMonth() + i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      // aqui entram TODOS os lançamentos do mês, pagos ou não — é uma previsão,
      // não o saldo real, então inclui recorrências e parcelas já programadas
      const doMes = transactions.filter((t) => monthKey(t.date) === key);
      const entradas = doMes.filter((t) => t.type === "entrada").reduce((s, t) => s + Number(t.amount), 0);
      const saidas = doMes.filter((t) => t.type === "saida").reduce((s, t) => s + Number(t.amount), 0);
      const sobra = entradas - saidas;
      acumulado += sobra;
      resultado.push({
        label: `${MESES_FULL[d.getMonth()]} de ${d.getFullYear()}`,
        curto: `${MESES_FULL[d.getMonth()].slice(0, 3)}/${d.getFullYear()}`,
        entradas, saidas, sobra, acumulado, isCurrent: i === 0,
      });
    }
    return { baseline, resultado };
  }, [transactions]);

  return (
    <>
      <h1 className="page-title">Projeção</h1>
      <p className="page-sub">Quanto deve sobrar nos próximos meses, pra você se programar pra compras.</p>

      <div className="panel" style={{ marginBottom: 16 }}>
        <p className="empty-note">
          Considera todos os lançamentos já cadastrados pra cada mês — inclusive contas recorrentes e parcelas futuras,
          mesmo que ainda estejam pendentes. Se algo mudar (você lançar um gasto novo, por exemplo), a projeção se atualiza sozinha.
        </p>
      </div>

      {meses.resultado.map((m) => (
        <div className={`panel proj-row ${m.isCurrent ? "proj-current" : ""}`} key={m.curto}>
          <div className="proj-head">
            <div>
              <div className="display" style={{ fontSize: 15.5, fontWeight: 500 }}>{m.label}</div>
              {m.isCurrent && <span className="proj-tag">mês atual</span>}
            </div>
            <div className={`mono proj-sobra ${m.sobra >= 0 ? "pos" : "neg"}`}>
              {m.sobra >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
              {formatBRL(m.sobra)}
            </div>
          </div>
          <div className="proj-details">
            <span>Entradas previstas <b className="mono pos">{formatBRL(m.entradas)}</b></span>
            <span>Saídas previstas <b className="mono neg">{formatBRL(m.saidas)}</b></span>
          </div>
          <div className="proj-acumulado">
            Saldo acumulado projetado no fim do mês: <b className={`mono ${m.acumulado >= 0 ? "pos" : "neg"}`}>{formatBRL(m.acumulado)}</b>
          </div>
        </div>
      ))}
    </>
  );
}
