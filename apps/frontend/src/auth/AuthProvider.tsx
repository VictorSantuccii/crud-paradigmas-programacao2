import { AuthContext } from "@/auth/auth-context";
import type { Usuario } from "@/auth/types";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let ativo = true;

    fetch(`${apiUrl}/auth/me`, { credentials: "include" })
      .then(async (response) => {
        if (!response.ok) return null;
        const payload = (await response.json()) as { usuario: Usuario };
        return payload.usuario;
      })
      .then((usuarioAtual) => {
        if (ativo) setUsuario(usuarioAtual);
      })
      .catch(() => {
        if (ativo) setUsuario(null);
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });

    return () => {
      ativo = false;
    };
  }, []);

  const atualizarUsuario = useCallback((usuarioAtual: Usuario | null) => {
    setUsuario(usuarioAtual);
  }, []);
  const valor = useMemo(() => ({ usuario, carregando, atualizarUsuario }), [usuario, carregando, atualizarUsuario]);

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}
