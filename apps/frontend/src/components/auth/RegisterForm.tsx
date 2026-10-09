import { Button } from "@/components/ui/Button";
import type { FormEvent } from "react";

const inputClass =
  "w-full rounded-lg border border-outline bg-surface px-4 py-3 font-body-md text-on-surface transition-shadow focus:border-primary focus:ring-2 focus:ring-primary focus:outline-none";

export function RegisterForm() {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label
          htmlFor="register-name"
          className="mb-2 block font-label-md text-on-surface-variant"
        >
          Nome completo
        </label>
        <input
          id="register-name"
          name="nome"
          type="text"
          autoComplete="name"
          className={inputClass}
          placeholder="Seu nome"
        />
      </div>
      <div>
        <label
          htmlFor="register-email"
          className="mb-2 block font-label-md text-on-surface-variant"
        >
          E-mail
        </label>
        <input
          id="register-email"
          name="email"
          type="email"
          autoComplete="email"
          className={inputClass}
          placeholder="seu@email.com"
        />
      </div>
      <div>
        <label
          htmlFor="register-cpf"
          className="mb-2 block font-label-md text-on-surface-variant"
        >
          CPF
        </label>
        <input
          id="register-cpf"
          name="cpf"
          type="text"
          inputMode="numeric"
          autoComplete="off"
          className={inputClass}
          placeholder="000.000.000-00"
        />
      </div>
      <div>
        <label
          htmlFor="register-password"
          className="mb-2 block font-label-md text-on-surface-variant"
        >
          Senha
        </label>
        <input
          id="register-password"
          name="senha"
          type="password"
          autoComplete="new-password"
          className={inputClass}
          placeholder="••••••••"
        />
      </div>
      <div>
        <label
          htmlFor="register-password-confirm"
          className="mb-2 block font-label-md text-on-surface-variant"
        >
          Confirmar senha
        </label>
        <input
          id="register-password-confirm"
          name="confirmarSenha"
          type="password"
          autoComplete="new-password"
          className={inputClass}
          placeholder="••••••••"
        />
      </div>
      <Button type="submit" className="w-full py-3">
        Criar conta
      </Button>
    </form>
  );
}
