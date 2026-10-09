import { Icon } from "@/components/ui/Icon";
import { mainNavItems } from "@/config/navigation";
import { cn } from "@/lib/cn";
import { Link, useLocation } from "react-router-dom";

export function SiteHeader() {
  const { pathname } = useLocation();

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
        <nav className="hidden items-center gap-8 md:flex">
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
        </nav>
        <div className="flex items-center gap-4 text-primary">
          <Link
            to="/login"
            aria-label="Entrar"
            className="rounded-full p-2 transition-colors hover:bg-surface-container-high"
          >
            <Icon name="person" />
          </Link>
          <button
            type="button"
            aria-label="Menu"
            className="rounded-full p-2 text-on-surface-variant md:hidden"
          >
            <Icon name="menu" />
          </button>
        </div>
      </div>
    </header>
  );
}
