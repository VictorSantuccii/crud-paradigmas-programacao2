import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "@/components/auth/LoginForm";
import { Link } from "react-router-dom";

export function LoginPage() {
  return (
    <AuthShell
      title="Bem-vindo de volta"
      subtitle="Entre na sua conta para gerenciar seus pets e agendamentos."
      footer={
        <>
          Ainda não tem conta?{" "}
          <Link to="/cadastro" className="font-semibold text-primary hover:underline">
            Cadastre-se
          </Link>
        </>
      }
    >
      <LoginForm />
    </AuthShell>
  );
}
