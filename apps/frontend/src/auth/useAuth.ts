import { AuthContext } from "@/auth/auth-context";
import { useContext } from "react";

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth deve ser usado dentro de AuthProvider.");
  return context;
}
