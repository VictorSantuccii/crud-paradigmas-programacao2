import { Icon } from "@/components/ui/Icon";
import type { BookingStep } from "@/types/booking";
import { cn } from "@/lib/cn";

type BookingStepperProps = {
  steps: BookingStep[];
};

export function BookingStepper({ steps }: BookingStepperProps) {
  return (
    <div className="mb-12 flex w-full justify-center">
      <div className="flex w-full max-w-2xl items-center gap-2 md:gap-4">
        {steps.map((step, index) => (
          <div key={step.id} className="contents">
            <div
              className={cn(
                "flex flex-col items-center gap-2",
                step.active ? "text-primary" : "text-outline-variant",
              )}
            >
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full",
                  step.active
                    ? "bg-primary text-on-primary shadow-md"
                    : "bg-surface-variant",
                )}
              >
                <Icon name={step.icon} filled={step.active} />
              </div>
              <span
                className={cn(
                  "hidden font-label-md md:block",
                  step.active && "font-bold",
                )}
              >
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 ? (
              <div
                className={cn(
                  "h-1 flex-1 rounded-full",
                  step.active ? "bg-primary-fixed" : "bg-surface-variant",
                )}
              />
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
