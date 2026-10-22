import { dadosContato } from '@/auth/profile-data';
import { ProfileFields } from '@/components/auth/ProfileFields';
import { guardarDestino, destinoInterno } from '@/auth/destination';
import { Icon } from '@/components/ui/Icon';
import { Field } from '@/components/forms/Field';
import { FormErrors } from '@/components/forms/FormErrors';
import { formFailure, validarFormulario, type FormFailure } from '@/lib/form-validation';
import { api } from '@/lib/api';
import { useAuth } from '@/auth/useAuth';
import type { Usuario } from '@/auth/types';
import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
type AuthTab = 'login' | 'register';
type AuthResponse = { requiresOnboarding?: boolean; usuario?: Usuario };
export function AuthPage({ initialTab }: { initialTab: AuthTab }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { atualizarUsuario } = useAuth();
  const [tab, setTab] = useState<AuthTab>(initialTab);
  const [showPassword, setShowPassword] = useState(false);
  const [failure, setFailure] = useState<FormFailure | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const from = (location.state as { from?: string } | null)?.from;
  function concluir(payload: AuthResponse, contaCriada = false) {
    const destino = guardarDestino(destinoInterno(from));
    if (payload.requiresOnboarding) { navigate('/cadastro/google/cpf', { state: { from: destino } }); return; }
    if (!payload.usuario) throw new Error('A resposta da autenticação não trouxe os dados do usuário.');
    atualizarUsuario(payload.usuario);
    const incompleto = payload.usuario.role === 'CLIENTE' && !payload.usuario.perfilCompleto;
    navigate(incompleto ? '/cadastro/google/cpf' : destino, { replace: true, state: { from: destino, ...(contaCriada ? { notice: 'Conta criada com sucesso.' } : {}) } });
  }
  async function handleGoogleAuth() {
    if (submitting) return;
    setFailure(null); setSubmitting(true);
    try {
      const [{ GoogleAuthProvider, signInWithPopup, signOut }, { obterFirebaseAuth }] = await Promise.all([import('firebase/auth'), import('@/lib/firebase')]);
      const auth = obterFirebaseAuth();
      const resultado = await signInWithPopup(auth, new GoogleAuthProvider());
      const payload = await api<AuthResponse>('/auth/google', { method: 'POST', body: { idToken: await resultado.user.getIdToken() } });
      await signOut(auth).catch(() => undefined);
      concluir(payload);
    } catch (error) {
      setFailure((error as { code?: string }).code === 'auth/popup-closed-by-user' ? { message: 'O acesso com Google foi cancelado.', fields: {} } : formFailure(error));
    } finally { setSubmitting(false); }
  }
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    const invalid = validarFormulario(event.currentTarget);
    if (invalid) { setFailure(invalid); return; }
    const form = new FormData(event.currentTarget);
    const email = String(form.get('email') || '');
    const senha = String(form.get('senha') || '');
    if (tab === 'register' && senha !== form.get('confirmarSenha')) {
      setFailure({ message: 'Revise a confirmação da senha.', fields: { confirmarSenha: 'A confirmação da senha não confere.' } }); return;
    }
    setFailure(null); setSubmitting(true);
    try {
      concluir(await api<AuthResponse>(`/auth/${tab === 'login' ? 'login' : 'cadastro'}`, { method: 'POST', body: tab === 'login' ? { email, senha } : { ...dadosContato(form), email, senha, nome: form.get('nome'), cpf: form.get('cpf'), confirmarSenha: form.get('confirmarSenha') } }), tab === 'register');
    } catch (error) { setFailure(formFailure(error)); } finally { setSubmitting(false); }
  }
  const errors = failure?.fields;
  return <main className="min-h-screen bg-surface-container-low px-margin-mobile py-8 md:px-margin-desktop md:py-12">
    <div className="mx-auto max-w-container-max">
      <div className="grid overflow-hidden rounded-2xl bg-surface-container-lowest shadow-xl lg:grid-cols-12">
        <aside className="relative flex flex-col justify-between overflow-hidden bg-gradient-to-br from-primary via-primary-container to-primary p-8 text-on-primary md:p-12 lg:col-span-5">
          <div className="pointer-events-none absolute -top-16 -right-16 h-56 w-56 rounded-full bg-on-primary/10" />
          <div className="relative"><Link to="/" className="mb-12 inline-flex items-center gap-2 font-headline-md font-bold"><Icon name="pets" filled />PetExpress</Link>
            <h1 className="mb-4 font-headline-lg text-3xl leading-tight">Seu perfil e seus companheiros, sempre por perto.</h1>
            <p className="mb-8 leading-relaxed text-primary-fixed">Mantenha seus dados de contato atualizados e cadastre seus pets em um só lugar.</p>
            <div className="space-y-4">{[['person', 'Seu perfil de tutor', 'Atualize nome, e-mail e telefone quando precisar.'], ['location_on', 'Seus endereços', 'Cadastre e gerencie seus endereços de contato.'], ['pets', 'Seus companheiros', 'Guarde nome, espécie, idade, porte e raça dos seus pets.']].map(([icon, title, detail]) => <div key={title} className="flex items-start gap-3 rounded-xl bg-on-primary/10 p-4"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface text-primary"><Icon name={icon} /></span><div><h2 className="font-bold">{title}</h2><p className="mt-1 text-sm text-primary-fixed">{detail}</p></div></div>)}</div>
          </div>
          <p className="mt-10 text-sm text-primary-fixed">Cuidado começa com informações atualizadas.</p>
        </aside>
        <section className="flex flex-col justify-center p-6 sm:p-10 md:p-12 lg:col-span-7">
          <div className="mx-auto w-full max-w-md">
            <div className="mb-8 flex gap-2 rounded-full bg-surface-container-low p-1.5" aria-label="Acesso à conta">{(['login', 'register'] as const).map(value => <button key={value} type="button" aria-pressed={tab === value} disabled={submitting} onClick={() => { setTab(value); setFailure(null); }} className={`flex-1 rounded-full px-3 py-3 text-sm font-bold ${tab === value ? 'bg-primary text-on-primary' : 'text-on-surface-variant'}`}>{value === 'login' ? 'Entrar na Conta' : 'Criar Nova Conta'}</button>)}</div>
            <h2 className="font-headline-lg text-2xl font-bold text-on-surface">{tab === 'login' ? 'Acesse sua área de tutor' : 'Crie seu perfil de tutor'}</h2>
            <p className="mt-2 mb-6 text-on-surface-variant">{tab === 'login' ? 'Entre para gerenciar seus companheiros.' : 'Preencha seus dados de contato e endereço.'}</p>
            <form key={tab} id="auth-form" noValidate onSubmit={handleSubmit} className="space-y-4" aria-busy={submitting}>
              <FormErrors failure={failure} formId="auth-form" />
              <fieldset disabled={submitting} className="space-y-4">
                <legend className="sr-only">{tab === 'login' ? 'Credenciais' : 'Dados do cadastro'}</legend>
                {tab === 'register' && <Field name="nome" label="Nome completo" autoComplete="name" required errors={errors} />}
                <Field name="email" label="E-mail" type="email" autoComplete="email" required errors={errors} placeholder="voce@exemplo.com" />
                {tab === 'register' && <ProfileFields incluirCpf errors={errors} />}
                <Field name="senha" label={tab === 'login' ? 'Senha' : 'Criar senha'} type={showPassword ? 'text' : 'password'} minLength={tab === 'register' ? 8 : undefined} autoComplete={tab === 'login' ? 'current-password' : 'new-password'} required errors={errors} />
                <button type="button" aria-pressed={showPassword} onClick={() => setShowPassword(value => !value)} className="text-sm font-semibold text-primary underline">{showPassword ? 'Ocultar senha' : 'Mostrar senha'}</button>
                {tab === 'register' && <Field name="confirmarSenha" label="Confirmar senha" type="password" minLength={8} autoComplete="new-password" required errors={errors} />}
                <button type="submit" disabled={submitting} className="flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 font-bold text-on-primary shadow-md hover:bg-primary-container disabled:opacity-60">{submitting ? 'Conectando…' : tab === 'login' ? 'Entrar no PetExpress' : 'Criar Minha Conta Gratuita'}<Icon name={tab === 'login' ? 'arrow_forward' : 'pets'} /></button>
              </fieldset>
            </form>
            <div className="my-6 flex items-center gap-3 text-xs uppercase text-outline"><span className="h-px flex-1 bg-outline-variant" />ou continue com<span className="h-px flex-1 bg-outline-variant" /></div>
            <button type="button" onClick={handleGoogleAuth} disabled={submitting} className="w-full rounded-full bg-surface-container-low px-5 py-3 font-bold text-on-surface hover:bg-surface-container disabled:opacity-60">Continuar com Google</button>
          </div>
        </section>
      </div>
      <div className="mt-6 text-center text-sm text-on-surface-variant"><Link to="/" className="hover:text-primary">← Voltar para o início</Link></div>
    </div>
  </main>;
}
