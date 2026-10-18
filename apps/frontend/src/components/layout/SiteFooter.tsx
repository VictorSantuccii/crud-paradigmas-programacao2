import { Icon } from "@/components/ui/Icon";
import { footerLinks } from "@/config/navigation";
import { Link } from "react-router-dom";

export function SiteFooter() {
  return (
    <footer className="mt-16 w-full bg-surface-container-highest">
      <div className="mx-auto grid max-w-container-max grid-cols-1 gap-gutter px-margin-mobile py-12 md:grid-cols-2 md:px-margin-desktop">
        <div>
          <Link
            to="/"
            className="mb-4 flex items-center gap-2 font-headline-md font-bold text-primary"
          >
            <Icon name="pets" filled />
            PetExpress
          </Link>
          <p className="mb-6 max-w-sm font-body-md text-on-surface-variant">
            Cuidando do seu melhor amigo com dedicação, tecnologia e muito
            carinho.
          </p>
          <p className="font-label-md text-on-surface-variant">
            © 2024 PetExpress - O melhor amigo do seu pet. Todos os direitos
            reservados.
          </p>
        </div>
        <div className="flex flex-col justify-center md:items-end">
          <nav className="flex flex-wrap justify-start gap-4 md:justify-end md:gap-8">
            {footerLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="font-label-md text-on-surface-variant transition-colors hover:text-secondary"
              >
                {link.label}
              </a>
            ))}
          </nav>
          <div className="mt-8 flex gap-4">
            <a
              href="#"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-surface text-primary soft-shadow transition-colors hover:bg-primary hover:text-white"
              aria-label="Compartilhar"
            >
              <Icon name="share" className="text-lg" />
            </a>
            <a
              href="#"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-surface text-primary soft-shadow transition-colors hover:bg-primary hover:text-white"
              aria-label="E-mail"
            >
              <Icon name="mail" className="text-lg" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
