import { createContext } from "react";
import type { Usuario } from "@/auth/types";

export type AuthContextValue = {
  usuario: Usuario | null;
  carregando: boolean;
  atualizarUsuario: (usuario: Usuario | null) => void;
};

export const AuthContext = createContext<AuthContextValue | null>(null);
