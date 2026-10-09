export type NavItem = {
  label: string;
  to: string;
  match: (pathname: string) => boolean;
};

export const mainNavItems: NavItem[] = [
  {
    label: "Serviços",
    to: "/servicos",
    match: (pathname) => pathname.startsWith("/servicos"),
  },
  {
    label: "Consultas",
    to: "/consultas",
    match: (pathname) => pathname.startsWith("/consultas"),
  },
  {
    label: "Meus Pets",
    to: "/meus-pets",
    match: (pathname) => pathname.startsWith("/meus-pets"),
  },
];

export const footerLinks = [
  { label: "Sobre Nós", href: "#" },
  { label: "Política de Privacidade", href: "#" },
  { label: "Termos de Uso", href: "#" },
  { label: "Contato", href: "#" },
  { label: "Trabalhe Conosco", href: "#" },
];
