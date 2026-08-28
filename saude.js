export function clamp(v, min, max) {
  return Math.min(max, Math.max(min, v));
}

export const CLASSIFICACOES = [
  { id: "essencial", label: "Essencial", color: "#2F6B4A" },
  { id: "importante", label: "Importante", color: "#4C6B8A" },
  { id: "nao-essencial", label: "Não essencial", color: "#B8863B" },
  { id: "evitavel", label: "Evitável", color: "#B0453A" },
];

// Pontuação de 0-100, composta por fatores explicáveis.
// entradas/saidas aqui já devem vir SEM os gastos essenciais de patrimônio
// (isso é preparado para quando Investimentos/Reserva entrarem no cálculo).
export function computeSaudeFinanceira({ entradas, saidas, gastosFixos, gastosEvitaveis, saldoMes }) {
  if (!entradas || entradas <= 0) return null;

  const comprometidoRatio = saidas / entradas;
  const fixoRatio = gastosFixos / entradas;
  const evitavelRatio = gastosEvitaveis / entradas;
  const poupancaRatio = saldoMes / entradas;

  const s1 = clamp(35 * (1 - Math.max(0, (comprometidoRatio - 0.5) / 0.5)), 0, 35);
  const s2 = clamp(20 * (1 - Math.max(0, (fixoRatio - 0.3) / 0.3)), 0, 20);
  const s3 = clamp(20 * (1 - Math.max(0, (evitavelRatio - 0.1) / 0.2)), 0, 20);
  const s4 = clamp((25 * Math.max(0, poupancaRatio)) / 0.2, 0, 25);

  const total = Math.round(s1 + s2 + s3 + s4);

  let band, color;
  if (total >= 90) { band = "Excelente"; color = "#2F6B4A"; }
  else if (total >= 75) { band = "Muito boa"; color = "#4C8A5E"; }
  else if (total >= 60) { band = "Boa"; color = "#B8863B"; }
  else if (total >= 40) { band = "Atenção"; color = "#C9793D"; }
  else { band = "Crítica"; color = "#B0453A"; }

  const factors = [
    { id: "comprometimento", label: "Renda comprometida", score: Math.round(s1), max: 35 },
    { id: "fixos", label: "Gastos fixos", score: Math.round(s2), max: 20 },
    { id: "evitaveis", label: "Gastos evitáveis", score: Math.round(s3), max: 20 },
    { id: "poupanca", label: "Capacidade de poupança", score: Math.round(s4), max: 25 },
  ];

  const clauses = {
    comprometimento: `seus gastos representam ${Math.round(comprometidoRatio * 100)}% das suas entradas`,
    fixos: `seus gastos fixos consomem ${Math.round(fixoRatio * 100)}% da sua renda`,
    evitaveis: `seus gastos evitáveis somam ${Math.round(evitavelRatio * 100)}% do que você recebe`,
    poupanca: poupancaRatio >= 0
      ? `você está conseguindo guardar ${Math.round(poupancaRatio * 100)}% do que ganha`
      : `você está gastando mais do que ganha neste período`,
  };

  const ordenado = [...factors].sort((a, b) => a.score / a.max - b.score / b.max);
  const fraco1 = ordenado[0];
  const fraco2 = ordenado[1];
  let explanation = `Você recebeu ${total} pontos porque ${clauses[fraco1.id]}`;
  explanation += fraco2 && fraco2.score / fraco2.max < 0.85 ? `, e ${clauses[fraco2.id]}.` : ".";

  return { total, band, color, factors, explanation };
}
