import { Icon } from "@/components/ui/Icon";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";

type AuthShellProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
};

export function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <div className="flex min-h-screen flex-col bg-surface-container-low px-margin-mobile py-12 md:px-margin-desktop">
      <div className="mx-auto w-full max-w-md flex-1">
        <Link
          to="/"
          className="mb-10 flex items-center justify-center gap-2 font-headline-md font-bold text-primary"
        >
          <Icon name="pets" filled className="text-3xl" />
          PetExpress
        </Link>
        <div className="rounded-2xl border border-surface-variant bg-surface-container-lowest p-8 soft-shadow">
          <h1 className="mb-2 text-center font-headline-lg text-on-surface">
            {title}
          </h1>
          <p className="mb-8 text-center font-body-md text-on-surface-variant">
            {subtitle}
          </p>
          {children}
        </div>
        <p className="mt-6 text-center font-body-md text-on-surface-variant">
          {footer}
        </p>
      </div>
    </div>
  );
}
