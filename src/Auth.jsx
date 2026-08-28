import { useState } from "react";
import { supabase } from "./lib/supabaseClient";

export default function Auth() {
  const [mode, setMode] = useState("login"); // login | signup | forgot
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [okMsg, setOkMsg] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setOkMsg("");

    if (!email.trim()) { setError("Informe seu e-mail."); return; }
    if (mode !== "forgot" && password.length < 6) {
      setError("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }

    setLoading(true);
    try {
      if (mode === "signup") {
        const { error: err } = await supabase.auth.signUp({ email, password });
        if (err) throw err;
        setOkMsg("Conta criada! Verifique seu e-mail para confirmar o cadastro antes de entrar.");
        setMode("login");
      } else if (mode === "login") {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
        // o App.jsx escuta onAuthStateChange e troca de tela sozinho
      } else if (mode === "forgot") {
        const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin,
        });
        if (err) throw err;
        setOkMsg("Enviamos um link de redefinição de senha para o seu e-mail.");
      }
    } catch (err) {
      setError(traduzErro(err.message));
    } finally {
      setLoading(false);
    }
  }

  function traduzErro(msg) {
    if (/invalid login credentials/i.test(msg)) return "E-mail ou senha incorretos.";
    if (/user already registered/i.test(msg)) return "Já existe uma conta com esse e-mail — tente entrar.";
    if (/email not confirmed/i.test(msg)) return "Confirme seu e-mail antes de entrar (verifique sua caixa de entrada).";
    return msg;
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-brand">Sistema Financeiro</div>
        <div className="auth-sub">
          {mode === "login" && "Entre na sua conta"}
          {mode === "signup" && "Crie sua conta"}
          {mode === "forgot" && "Recuperar senha"}
        </div>

        {error && <p className="auth-error">{error}</p>}
        {okMsg && <p className="auth-ok">{okMsg}</p>}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>E-mail</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" autoFocus />
          </div>

          {mode !== "forgot" && (
            <div className="field">
              <label>Senha</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
            </div>
          )}

          {mode === "login" && (
            <div className="auth-forgot">
              <button type="button" onClick={() => { setMode("forgot"); setError(""); setOkMsg(""); }}>
                Esqueci minha senha
              </button>
            </div>
          )}

          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? "Aguarde…" : mode === "login" ? "Entrar" : mode === "signup" ? "Criar conta" : "Enviar link de recuperação"}
          </button>
        </form>

        <div className="auth-switch">
          {mode === "login" && (
            <>Não tem conta? <button onClick={() => { setMode("signup"); setError(""); setOkMsg(""); }}>Criar conta</button></>
          )}
          {(mode === "signup" || mode === "forgot") && (
            <>Já tem conta? <button onClick={() => { setMode("login"); setError(""); setOkMsg(""); }}>Entrar</button></>
          )}
        </div>
      </div>
    </div>
  );
}

