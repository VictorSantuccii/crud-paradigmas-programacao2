import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

type FeatureCardProps = {
  title: string;
  description: string;
  icon: string;
  iconClass?: string;
  className?: string;
  children?: ReactNode;
};

export function FeatureCard({
  title,
  description,
  icon,
  iconClass,
  className,
  children,
}: FeatureCardProps) {
  return (
    <div
      className={cn(
        "relative flex flex-col justify-between overflow-hidden rounded-2xl p-8 soft-shadow",
        className,
      )}
    >
      <div>
        <div className={cn("mb-6 w-fit rounded-xl p-3", iconClass)}>
          <Icon name={icon} />
        </div>
        <h3 className="mb-3 font-headline-md text-on-surface">{title}</h3>
        <p className="font-body-md text-on-surface-variant">{description}</p>
      </div>
      {children}
    </div>
  );
}
