import { AuthShell } from "@/components/auth/AuthShell";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { Link } from "react-router-dom";

export function CadastroPage() {
  return (
    <AuthShell
      title="Criar conta"
      subtitle="Cadastre-se para agendar serviços e acompanhar a saúde do seu pet."
      footer={
        <>
          Já tem conta?{" "}
          <Link to="/login" className="font-semibold text-primary hover:underline">
            Entrar
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthShell>
  );
}
