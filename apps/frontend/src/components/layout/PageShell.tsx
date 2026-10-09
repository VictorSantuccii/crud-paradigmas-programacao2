import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import type { ReactNode } from "react";

type PageShellProps = {
  children: ReactNode;
  className?: string;
};

export function PageShell({ children, className }: PageShellProps) {
  return (
    <div className={className}>
      <SiteHeader />
      <div className="overflow-x-hidden pt-20">{children}</div>
      <SiteFooter />
    </div>
  );
}
