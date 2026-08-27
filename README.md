# Livro-Caixa — Fase 1 (autenticação + persistência real)

Esta é a base do sistema rodando fora do Claude.ai, conectada ao Supabase de verdade:
cadastro, login, logout, recuperação de senha e o primeiro CRUD (lançamentos) já funcionam.

## O que já funciona nesta fase
- Cadastro de conta (com confirmação por e-mail)
- Login / Logout
- Recuperação de senha por e-mail
- Isolamento por usuário garantido pelo banco (Row Level Security)
- Lançar e visualizar movimentações (entradas/saídas) — persistidas de verdade no Postgres

## O que ainda falta portar (fases seguintes)
Gastos, Movimentações Mensais completas, Saúde Financeira, Investimentos, Reserva,
Parcelamentos, Lista de Compras, Configurações, gráficos, alertas, filtros — toda a
lógica já existe e validada no protótipo Claude, falta portar tela por tela.

## Rodar localmente (para testar antes de publicar)
Isso exige ter o Node.js instalado no seu computador.

```bash
npm install
npm run dev
```

Abre em `http://localhost:5173`.

## Publicar de verdade (Vercel)

1. Crie um repositório no GitHub e suba esta pasta inteira para ele
   (não suba o arquivo `.env.local` — ele já está no `.gitignore`, mas confira).
2. Entre em https://vercel.com e conecte sua conta do GitHub.
3. Clique em "Add New Project" e selecione o repositório que você acabou de criar.
4. Nas configurações do projeto, vá em **Environment Variables** e adicione:
   - `VITE_SUPABASE_URL` → `https://qwhhiymahhszvjtvaykn.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` → sua chave publishable do Supabase
5. Clique em **Deploy**. Em cerca de 1 minuto o site fica no ar com um endereço
   tipo `livro-caixa-seunome.vercel.app`.

## Importante sobre o Supabase
Por padrão, o Supabase exige que o e-mail seja confirmado antes do login funcionar.
Se quiser testar rápido sem configurar envio de e-mail: no painel do Supabase, vá em
**Authentication → Providers → Email** e desative "Confirm email" temporariamente.
