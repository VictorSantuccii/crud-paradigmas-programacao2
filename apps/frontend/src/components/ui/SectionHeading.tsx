import { cn } from "@/lib/cn";

type SectionHeadingProps = {
  title: string;
  description?: string;
  align?: "center" | "left";
  className?: string;
};

export function SectionHeading({
  title,
  description,
  align = "center",
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "mb-16",
        align === "center" && "text-center",
        className,
      )}
    >
      <h2 className="font-headline-lg text-on-surface mb-4">{title}</h2>
      {description ? (
        <p
          className={cn(
            "font-body-lg text-on-surface-variant max-w-2xl",
            align === "center" && "mx-auto",
          )}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}
