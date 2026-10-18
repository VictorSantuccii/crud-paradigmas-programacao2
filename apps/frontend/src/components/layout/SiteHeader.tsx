import { Icon } from "@/components/ui/Icon";
import { mainNavItems } from "@/config/navigation";
import { cn } from "@/lib/cn";
import { useAuth } from "@/auth/useAuth";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";

export function SiteHeader() {
  const { pathname } = useLocation();
  const { usuario, carregando, atualizarUsuario } = useAuth();
  const [menuAberto, setMenuAberto] = useState(false);
  const [erroLogout, setErroLogout] = useState("");
  const navigate = useNavigate();

  async function sair() {
    setErroLogout("");
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:3000"}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Não foi possível encerrar a sessão.");
      atualizarUsuario(null);
      setMenuAberto(false);
      navigate("/", { replace: true });
    } catch {
      setErroLogout("Não foi possível sair. Tente novamente.");
    }
  }

  return (
    <header className="fixed top-0 left-0 z-50 flex h-20 w-full items-center justify-between bg-surface px-margin-mobile shadow-sm md:px-margin-desktop">
      <div className="mx-auto flex h-full w-full max-w-container-max items-center justify-between">
        <Link
          to="/"
          className="flex items-center gap-2 font-headline-md font-bold text-primary"
        >
          <Icon name="pets" filled className="text-3xl" />
          PetExpress
        </Link>
        {usuario && <nav className="hidden items-center gap-8 md:flex">
          {mainNavItems.map((item) => {
            const active = item.match(pathname);
            return (
              <Link
                key={item.label}
                to={item.to}
                className={cn(
                  "font-label-md transition-colors duration-200",
                  active
                    ? "border-b-2 border-primary pb-1 font-bold text-primary"
                    : "font-medium text-on-surface-variant hover:text-primary",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>}
        <div className="flex items-center gap-4 text-primary">
          {!carregando && !usuario && <Link to="/login" className="rounded-full bg-primary px-5 py-2.5 font-label-md font-bold text-on-primary transition-colors hover:bg-primary-container">Entrar</Link>}
          {usuario && <div className="flex items-center gap-2">
            <Link to="/meu-perfil" className="inline-flex items-center gap-2 rounded-full px-2 py-2 font-label-md font-semibold text-primary transition-colors hover:bg-surface-container-high" aria-label={`Perfil de ${usuario.nome}`}>
              <Icon name="person" />
              <span className="max-w-36 truncate">{usuario.nome}</span>
            </Link>
            <button type="button" onClick={sair} aria-label="Sair da conta" title="Sair da conta" className="rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-primary">
              <Icon name="logout" />
            </button>
          </div>}
          {usuario && <button
            type="button"
            aria-label="Menu"
            aria-expanded={menuAberto}
            onClick={() => setMenuAberto((aberto) => !aberto)}
            className="rounded-full p-2 text-on-surface-variant md:hidden"
          >
            <Icon name="menu" />
          </button>}
        </div>
      </div>
      {usuario && menuAberto && <nav aria-label="Navegação principal" className="absolute top-full left-0 flex w-full flex-col gap-1 border-t border-outline-variant bg-surface px-margin-mobile py-3 shadow-md md:hidden">{mainNavItems.map((item) => <Link key={item.label} to={item.to} onClick={() => setMenuAberto(false)} className={cn("rounded-lg px-4 py-3 font-label-md", item.match(pathname) ? "bg-primary-fixed text-primary" : "text-on-surface-variant hover:bg-surface-container-low")}>{item.label}</Link>)}</nav>}
      {erroLogout && <span role="alert" className="absolute top-full right-4 rounded-lg bg-error-container px-4 py-2 text-sm text-on-error-container shadow-md">{erroLogout}</span>}
    </header>
  );
}
