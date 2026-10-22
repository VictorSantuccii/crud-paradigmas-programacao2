import { Icon } from "@/components/ui/Icon";
import type { BookingStep } from "@/types/booking";
import { cn } from "@/lib/cn";

type BookingStepperProps = {
  steps: BookingStep[];
};

export function BookingStepper({ steps }: BookingStepperProps) {
  const activeIndex = steps.reduce(
    (lastActive, step, index) => (step.active ? index : lastActive),
    -1,
  );

  return (
    <div className="mx-auto flex w-full max-w-container-max items-center justify-between gap-2 md:gap-4">
        {steps.map((step, index) => (
          <div key={step.id} className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
            <div
              className={cn(
                "flex shrink-0 items-center gap-2 sm:gap-3",
                step.active ? "text-primary" : "text-outline-variant",
              )}
            >
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full",
                  index <= activeIndex
                    ? "bg-primary text-on-primary"
                    : "bg-surface-container-high text-on-surface-variant",
                )}
              >
                <Icon name={step.icon} filled={index <= activeIndex} />
              </div>
              <div className="hidden sm:block">
                <p className="font-label-md text-primary">Passo {index + 1}</p>
                <p className="whitespace-nowrap text-sm font-bold text-on-surface">{step.label}</p>
              </div>
            </div>
            {index < steps.length - 1 ? (
              <div
                className={cn(
                  "h-1 min-w-2 flex-1 rounded-full",
                  index < activeIndex ? "bg-primary" : "bg-surface-container-highest",
                )}
              />
            ) : null}
          </div>
        ))}
    </div>
  );
}
