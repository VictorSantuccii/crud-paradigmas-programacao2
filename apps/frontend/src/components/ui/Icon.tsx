import { cn } from "@/lib/cn";

type IconProps = {
  name: string;
  filled?: boolean;
  className?: string;
};

export function Icon({ name, filled = false, className }: IconProps) {
  return (
    <span
      className={cn(
        "material-symbols-outlined",
        filled && "fill",
        className,
      )}
      aria-hidden
    >
      {name}
    </span>
  );
}
