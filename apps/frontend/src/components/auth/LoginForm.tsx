import { Button } from "@/components/ui/Button";
import type { FormEvent } from "react";

const inputClass =
  "w-full rounded-lg border border-outline bg-surface px-4 py-3 font-body-md text-on-surface transition-shadow focus:border-primary focus:ring-2 focus:ring-primary focus:outline-none";

export function LoginForm() {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label
          htmlFor="login-email"
          className="mb-2 block font-label-md text-on-surface-variant"
        >
          E-mail
        </label>
        <input
          id="login-email"
          name="email"
          type="email"
          autoComplete="email"
          className={inputClass}
          placeholder="seu@email.com"
        />
      </div>
      <div>
        <label
          htmlFor="login-password"
          className="mb-2 block font-label-md text-on-surface-variant"
        >
          Senha
        </label>
        <input
          id="login-password"
          name="password"
          type="password"
          autoComplete="current-password"
          className={inputClass}
          placeholder="••••••••"
        />
      </div>
      <Button type="submit" className="w-full py-3">
        Entrar
      </Button>
    </form>
  );
}
