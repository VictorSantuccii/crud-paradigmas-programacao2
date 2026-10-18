import { useAuth } from "@/auth/useAuth";
import type { Usuario } from "@/auth/types";
import { Icon } from "@/components/ui/Icon";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useState, type FormEvent } from "react";

type GoogleCpfState = { idToken?: string; from?: string };

export function GoogleCpfPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { atualizarUsuario } = useAuth();
  const { idToken, from } = (location.state as GoogleCpfState | null) ?? {};
  const [cpf, setCpf] = useState("");
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  if (!idToken) return <Navigate to="/login" replace />;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro("");
    setSalvando(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:3000"}/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ idToken, cpf }),
      });
      const payload = await response.json() as { message?: string; requiresCpf?: boolean; usuario?: Usuario };
      if (!response.ok) throw new Error(payload.message || "Não foi possível concluir o cadastro.");
      if (payload.requiresCpf || !payload.usuario) throw new Error("Informe um CPF válido para continuar.");

      const [{ signOut }, { obterFirebaseAuth }] = await Promise.all([
        import("firebase/auth"),
        import("@/lib/firebase"),
      ]);
      await signOut(obterFirebaseAuth()).catch(() => undefined);
      atualizarUsuario(payload.usuario);
      navigate(from || "/meu-perfil", { replace: true });
    } catch (submissionError) {
      setErro(submissionError instanceof Error ? submissionError.message : "Não foi possível concluir o cadastro.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface-container-low px-margin-mobile py-10 md:px-margin-desktop">
      <section className="auth-panel-enter w-full max-w-lg rounded-2xl bg-surface-container-lowest p-7 shadow-xl sm:p-10">
        <Link to="/" className="mb-10 inline-flex items-center gap-2 font-headline-md font-bold text-primary">
          <Icon name="pets" filled className="text-3xl" />PetExpress
        </Link>
        <div className="mb-7 flex h-14 w-14 items-center justify-center rounded-full bg-primary-fixed text-primary">
          <Icon name="badge" className="text-3xl" />
        </div>
        <h1 className="font-headline-lg text-3xl font-bold text-on-surface">Só falta seu CPF</h1>
        <p className="mt-2 text-on-surface-variant">Sua conta Google foi autenticada. Informe o CPF para concluir seu cadastro no PetExpress.</p>
        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label htmlFor="google-cpf" className="mb-2 block font-label-md text-on-surface">CPF</label>
            <input
              id="google-cpf"
              value={cpf}
              onChange={(event) => setCpf(event.target.value)}
              required
              autoComplete="off"
              inputMode="numeric"
              placeholder="000.000.000-00"
              className="w-full rounded-lg bg-surface-container-lowest px-4 py-3 font-body-md text-on-surface shadow-sm ring-1 ring-outline-variant outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <button type="submit" disabled={salvando} className="w-full rounded-full bg-primary px-5 py-3.5 font-label-md font-bold text-on-primary shadow-sm transition hover:bg-primary-container disabled:opacity-60">
            {salvando ? "Concluindo cadastro…" : "Concluir cadastro"}
          </button>
        </form>
        {erro && <p role="alert" className="mt-4 rounded-lg bg-error-container p-3 text-sm text-on-error-container">{erro}</p>}
      </section>
    </main>
  );
}
