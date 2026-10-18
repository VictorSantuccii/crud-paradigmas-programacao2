import { Icon } from "@/components/ui/Icon";
import { useAuth } from "@/auth/useAuth";
import type { Usuario } from "@/auth/types";
import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

type AuthTab = "login" | "register";

const inputClass =
  "w-full rounded-lg bg-surface-container-lowest py-3 pl-10 pr-4 font-body-md text-on-surface shadow-sm ring-1 ring-outline-variant outline-none transition-shadow placeholder:text-outline focus:ring-2 focus:ring-primary";

function AuthInput({
  id,
  name,
  label,
  icon,
  type = "text",
  placeholder,
  required = true,
}: {
  id: string;
  name?: string;
  label: string;
  icon: string;
  type?: string;
  placeholder: string;
  required?: boolean;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block font-label-md text-on-surface">
        {label}
      </label>
      <div className="relative">
        <Icon name={icon} className="absolute top-1/2 left-3.5 -translate-y-1/2 text-xl text-outline" />
        <input id={id} name={name || id} type={type} placeholder={placeholder} required={required} className={inputClass} />
      </div>
    </div>
  );
}

function Benefits() {
  const items = [
    ["vaccines", "Alertas de Vacinação e Remédios", "Receba notificações personalizadas no WhatsApp."],
    ["event_available", "Agendamentos Express", "Reserve consultas, tosa e hotelzinho com 1 toque."],
    ["verified_user", "Histórico Unificado e Seguro", "Exames, receitas e diagnósticos sempre protegidos."],
  ];
  return (
    <div className="space-y-4">
      {items.map(([icon, title, description]) => (
        <div key={title} className="flex items-start gap-3 rounded-xl bg-on-primary/10 p-3.5 backdrop-blur-sm">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface text-primary"><Icon name={icon} filled /></span>
          <div><h2 className="font-label-md font-bold text-on-primary">{title}</h2><p className="text-sm text-primary-fixed">{description}</p></div>
        </div>
      ))}
    </div>
  );
}

export function AuthPage({ initialTab }: { initialTab: AuthTab }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { atualizarUsuario } = useAuth();
  const [tab, setTab] = useState<AuthTab>(initialTab);
  const [showPassword, setShowPassword] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function enviarTokenGoogle(idToken: string) {
    const response = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:3000"}/auth/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ idToken }),
    });
    const payload = await response.json() as { message?: string; requiresCpf?: boolean; usuario?: Usuario };
    if (!response.ok) throw new Error(payload.message || "Não foi possível autenticar com Google.");
    if (payload.requiresCpf) {
      const from = (location.state as { from?: string } | null)?.from;
      navigate("/cadastro/google/cpf", { state: { idToken, from } });
      return;
    }
    if (!payload.usuario) throw new Error("A resposta da autenticação não trouxe os dados do usuário.");
    atualizarUsuario(payload.usuario);
    const [{ signOut }, { obterFirebaseAuth }] = await Promise.all([
      import("firebase/auth"),
      import("@/lib/firebase"),
    ]);
    await signOut(obterFirebaseAuth()).catch(() => undefined);
    const destino = (location.state as { from?: string } | null)?.from || "/meu-perfil";
    navigate(destino, { replace: true });
  }

  async function handleGoogleAuth() {
    setNotice("");
    setError("");
    setSubmitting(true);
    try {
      const [{ GoogleAuthProvider, signInWithPopup }, { obterFirebaseAuth }] = await Promise.all([
        import("firebase/auth"),
        import("@/lib/firebase"),
      ]);
      const auth = obterFirebaseAuth();
      const resultado = await signInWithPopup(auth, new GoogleAuthProvider());
      await enviarTokenGoogle(await resultado.user.getIdToken());
    } catch (googleError) {
      const codigo = (googleError as { code?: string }).code;
      setError(codigo === "auth/popup-closed-by-user"
        ? "O acesso com Google foi cancelado."
        : googleError instanceof Error ? googleError.message : "Não foi possível conectar com Google.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice("");
    setError("");
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") || "");
    const senha = String(form.get("senha") || "");
    if (tab === "register" && senha !== form.get("confirmarSenha")) {
      setError("A confirmação da senha não confere.");
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:3000"}/auth/${tab === "login" ? "login" : "cadastro"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(tab === "login"
          ? { email, senha }
          : { email, senha, nome: form.get("nome"), cpf: form.get("cpf"), confirmarSenha: form.get("confirmarSenha") }),
      });
      const payload = await response.json() as { message?: string; usuario?: Usuario };
      if (!response.ok) throw new Error(payload.message || "Não foi possível autenticar.");
      if (!payload.usuario) throw new Error("A resposta da autenticação não trouxe os dados do usuário.");
      atualizarUsuario(payload.usuario);
      setNotice(tab === "login" ? "Login realizado com sucesso." : "Conta criada com sucesso.");
      const destino = (location.state as { from?: string } | null)?.from || "/meu-perfil";
      navigate(destino, { replace: true });
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Falha ao conectar com o servidor.");
    } finally {
      setSubmitting(false);
    }
  }

  const switchTab = (value: AuthTab) => {
    setNotice("");
    setError("");
    setTab(value);
  };

  const googleButton = (
    <button type="button" onClick={handleGoogleAuth} disabled={submitting} className="flex w-full items-center justify-center gap-3 rounded-full bg-surface-container-low px-4 py-3 font-label-md font-semibold text-on-surface shadow-sm transition hover:bg-surface-container disabled:opacity-60">
      <svg aria-hidden="true" viewBox="0 0 48 48" className="h-5 w-5"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5Z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.76 7.18l7.73 6C44.42 37.88 46.98 31.72 46.98 24.55Z"/><path fill="#FBBC05" d="M10.53 28.59A14.4 14.4 0 0 1 9.75 24c0-1.59.27-3.13.76-4.59l-7.98-6.19A23.9 23.9 0 0 0 0 24c0 3.87.93 7.52 2.56 10.78l7.97-6.19Z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.91-5.8l-7.73-6c-2.14 1.44-4.88 2.3-8.18 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48Z"/></svg>
      {submitting ? "Conectando…" : "Continuar com Google"}
    </button>
  );

  return (
    <main className="min-h-screen bg-surface-container-low px-margin-mobile py-8 md:px-margin-desktop md:py-12">
      <div className="mx-auto max-w-container-max">
        <div className="relative grid overflow-hidden rounded-2xl bg-surface-container-lowest shadow-xl lg:grid-cols-12">
          <aside className="motion-enter-left relative flex flex-col justify-between overflow-hidden bg-gradient-to-br from-primary via-primary-container to-primary p-8 text-on-primary md:p-12 lg:col-span-5">
            <div className="pointer-events-none absolute -top-16 -right-16 h-56 w-56 rounded-full bg-on-primary/10" />
            <div className="relative z-10">
              <Link to="/" className="mb-12 inline-flex items-center gap-2 font-headline-md font-bold text-on-primary"><Icon name="pets" filled />PetExpress</Link>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-on-primary/15 px-3 py-1.5 text-sm text-primary-fixed"><Icon name="favorite" filled />Comunidade PetExpress</div>
              <h1 className="mb-4 font-headline-lg text-3xl leading-tight text-on-primary">O bem-estar do seu amigo em boas mãos.</h1>
              <p className="mb-8 leading-relaxed text-primary-fixed">Acesse o histórico clínico completo, acompanhe a caderneta de vacinas e reserve horários em instantes.</p>
              <Benefits />
            </div>
            <div className="relative z-10 mt-8 flex items-center gap-4 rounded-xl bg-surface-container-lowest/15 p-4 backdrop-blur-md">
              <img className="h-14 w-14 rounded-full object-cover ring-2 ring-primary-fixed" alt="Golden retriever em uma clínica veterinária" src="https://lh3.googleusercontent.com/aida-public/AB6AXuA9uyc5qEY291tD1e2T5EXXuerGHWgI29E8HfbzeZaQmaPkyOvwLc5ksS7oFCkn1BEGdSMF4RVBPP7MqzeAxFl_AhniFh5CHdoIl4-MLOeIX9ZNwXDmM5vZDxUoit86CRAnTfqd4z4-EpvrqWN6GJ_pDm3E1cv_7Tj4zqMelPy1B640XwPJGH9Ra4LT-8FsBtpVhKni6wt5P4UR7k399RWwVJvm6d6Fgxg32xuvnRAeMkZuKRbKLi7_7g" />
              <div className="min-w-0"><div className="mb-1 flex gap-1 text-secondary-fixed">{Array.from({ length: 5 }, (_, index) => <Icon key={index} name="star" filled className="text-sm" />)}</div><p className="truncate text-sm font-semibold text-on-primary">“O PetExpress salvou a rotina com o Pipoca!”</p><span className="text-xs text-primary-fixed">Mariana S. • Tutora há 2 anos</span></div>
            </div>
          </aside>

          <section className="motion-enter-right flex flex-col justify-center p-6 sm:p-10 md:p-12 lg:col-span-7">
            <div className="mx-auto w-full max-w-md">
              <div role="tablist" aria-label="Acesso à conta" className="relative mb-8 flex rounded-full bg-surface-container-low p-1.5">
                <span aria-hidden="true" className={`auth-tab-indicator absolute inset-y-1.5 left-1.5 w-[calc(50%-0.375rem)] rounded-full bg-primary ${tab === "register" ? "translate-x-full" : ""}`} />
                {(["login", "register"] as const).map((value) => (
                  <button key={value} type="button" role="tab" aria-selected={tab === value} onClick={() => switchTab(value)} className={`relative z-10 flex-1 rounded-full px-3 py-2.5 text-sm font-bold transition-colors ${tab === value ? "text-on-primary" : "text-on-surface-variant hover:text-primary"}`}>
                    <span className="flex items-center justify-center gap-2"><Icon name={value === "login" ? "login" : "person_add"} />{value === "login" ? "Entrar na Conta" : "Criar Nova Conta"}</span>
                  </button>
                ))}
              </div>
              {tab === "login" ? (
                <div key={tab} role="tabpanel" className="auth-panel-enter">
                  <div className="mb-6"><h2 className="font-headline-lg text-2xl font-bold text-on-surface">Acesse sua área de tutor</h2><p className="mt-1 text-on-surface-variant">Insira suas credenciais para gerenciar seus companheiros.</p></div>
                  <form className="space-y-4" onSubmit={handleSubmit}>
                    <AuthInput id="email" name="email" label="E-mail" icon="alternate_email" type="email" placeholder="exemplo@petexpress.com.br" />
                    <div><div className="mb-1.5 flex items-center justify-between"><label htmlFor="login-senha" className="font-label-md text-on-surface">Senha</label></div><div className="relative"><Icon name="lock" className="absolute top-1/2 left-3.5 -translate-y-1/2 text-xl text-outline" /><input id="login-senha" name="senha" required type={showPassword ? "text" : "password"} placeholder="••••••••" autoComplete="current-password" className={`${inputClass} pr-12`} /><button type="button" aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"} onClick={() => setShowPassword((current) => !current)} className="absolute top-1/2 right-3.5 -translate-y-1/2 text-outline hover:text-primary"><Icon name={showPassword ? "visibility_off" : "visibility"} /></button></div></div>
                    <button disabled={submitting} className="flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 font-headline-md font-bold text-on-primary shadow-md transition hover:bg-primary-container disabled:opacity-60">{submitting ? "Entrando…" : "Entrar no PetExpress"} <Icon name="arrow_forward" /></button>
                  </form>
                  <div className="mt-8"><div className="relative mb-5 flex items-center justify-center"><div className="h-px w-full bg-surface-container-highest" /><span className="absolute bg-surface-container-lowest px-4 text-xs uppercase tracking-wider text-outline">ou acesse com</span></div>{googleButton}</div>
                  <p className="mt-8 text-center text-sm text-on-surface-variant">Ainda não tem conta? <button onClick={() => switchTab("register")} type="button" className="font-bold text-primary hover:underline">Cadastre-se gratuitamente</button></p>
                </div>
              ) : (
                <div key={tab} role="tabpanel" className="auth-panel-enter">
                  <div className="mb-6"><h2 className="font-headline-lg text-2xl font-bold text-on-surface">Crie seu perfil de tutor</h2><p className="mt-1 text-on-surface-variant">Leva menos de 1 minuto para cadastrar você e seu melhor amigo.</p></div>
                  <form className="space-y-3.5" onSubmit={handleSubmit}>
                    <AuthInput id="nome" name="nome" label="Nome Completo" icon="person" placeholder="Ex: Carlos Eduardo de Oliveira" />
                    <AuthInput id="email" name="email" label="E-mail" icon="mail" type="email" placeholder="carlos@exemplo.com" />
                    <AuthInput id="cpf" name="cpf" label="CPF" icon="badge" placeholder="000.000.000-00" />
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2"><div><label htmlFor="reg-senha" className="mb-1 block font-label-md text-on-surface">Criar Senha</label><input id="reg-senha" name="senha" type="password" minLength={8} required placeholder="Mín. 8 dígitos" autoComplete="new-password" className="w-full rounded-lg bg-surface-container-lowest px-3.5 py-2.5 shadow-sm ring-1 ring-outline-variant outline-none focus:ring-2 focus:ring-primary" /></div><div><label htmlFor="reg-password-confirm" className="mb-1 block font-label-md text-on-surface">Confirmar Senha</label><input id="reg-password-confirm" name="confirmarSenha" type="password" minLength={8} required placeholder="Repita a senha" autoComplete="new-password" className="w-full rounded-lg bg-surface-container-lowest px-3.5 py-2.5 shadow-sm ring-1 ring-outline-variant outline-none focus:ring-2 focus:ring-primary" /></div></div>
                    <div className="space-y-2.5 pt-2 text-sm text-on-surface-variant"><label className="flex items-start gap-2.5"><input type="checkbox" required className="mt-1 rounded text-primary focus:ring-primary" /><span>Concordo com os <a href="#termos" className="text-primary underline">Termos de Serviço</a> e a <a href="#privacidade" className="text-primary underline">Política de Privacidade</a> do PetExpress.</span></label><label className="flex items-start gap-2.5"><input type="checkbox" defaultChecked className="mt-1 rounded text-tertiary focus:ring-tertiary" /><span>Desejo receber lembretes de consultas, campanhas de vacinação e ofertas via WhatsApp.</span></label></div>
                    <button disabled={submitting} className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 font-headline-md font-bold text-on-primary shadow-md transition hover:bg-primary-container disabled:opacity-60">{submitting ? "Criando conta…" : "Criar Minha Conta Gratuita"} <Icon name="pets" /></button>
                  </form>
                  <div className="mt-7"><div className="relative mb-5 flex items-center justify-center"><div className="h-px w-full bg-surface-container-highest" /><span className="absolute bg-surface-container-lowest px-4 text-xs uppercase tracking-wider text-outline">ou cadastre-se com</span></div>{googleButton}</div>
                  <p className="mt-6 text-center text-sm text-on-surface-variant">Já possui uma conta? <button onClick={() => switchTab("login")} type="button" className="font-bold text-primary hover:underline">Faça login aqui</button></p>
                </div>
              )}
              {notice && <p role="status" className="mt-4 rounded-lg bg-tertiary-fixed p-3 text-sm text-on-tertiary-fixed-variant">{notice}</p>}
              {error && <p role="alert" className="mt-4 rounded-lg bg-error-container p-3 text-sm text-on-error-container">{error}</p>}
            </div>
          </section>
        </div>
        <div className="mt-8 grid grid-cols-2 gap-3 text-center md:grid-cols-4">{[["security", "Dados protegidos"], ["medical_services", "Veterinários verificados"], ["schedule", "Suporte 24h"], ["thumb_up", "+45.000 pets atendidos"]].map(([icon, label]) => <div key={label} className="flex items-center justify-center gap-2 rounded-xl bg-surface-container p-3 text-sm font-label-md text-on-surface-variant"><Icon name={icon} className="text-primary" />{label}</div>)}</div>
        <div className="mt-5 text-center text-sm text-on-surface-variant"><Link to="/" className="hover:text-primary">← Voltar para o início</Link></div>
      </div>
    </main>
  );
}
