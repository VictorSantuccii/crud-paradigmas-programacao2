import { useAuth } from "@/auth/useAuth";
import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { usuario, carregando } = useAuth();
  const location = useLocation();

  if (carregando) return <div className="min-h-screen bg-surface" aria-label="Carregando sessão" />;
  if (!usuario) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (usuario.role === "CLIENTE" && !usuario.perfilCompleto) return <Navigate to="/cadastro/google/cpf" replace state={{ from: location.pathname + location.search }} />;
  return children;
}
