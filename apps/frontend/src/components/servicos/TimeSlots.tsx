import type { TimeSlot } from "@/types/booking";
import { cn } from "@/lib/cn";

type TimeSlotsProps = {
  slots: TimeSlot[];
  selectedDay: number;
  selectedTime: string;
  onSelectTime: (time: string) => void;
};

export function TimeSlots({
  slots,
  selectedDay,
  selectedTime,
  onSelectTime,
}: TimeSlotsProps) {
  return (
    <div>
      <span className="mb-4 block font-label-md text-on-surface-variant">
        Horários disponíveis para {selectedDay}/10
      </span>
      <div className="grid grid-cols-3 gap-3 md:grid-cols-4">
        {slots.map((slot) => {
          const isSelected = selectedTime === slot.time;
          const disabled = !slot.available;
          return (
            <button
              key={slot.time}
              type="button"
              disabled={disabled}
              onClick={() => slot.available && onSelectTime(slot.time)}
              className={cn(
                "rounded-lg border py-2 px-3 text-center font-body-md transition-colors",
                disabled &&
                  "cursor-not-allowed border-outline-variant/30 bg-surface-variant text-outline-variant line-through opacity-50",
                !disabled &&
                  !isSelected &&
                  "border-outline-variant bg-surface text-on-surface-variant hover:border-primary hover:text-primary",
                isSelected &&
                  "border-2 border-primary bg-primary-fixed font-bold text-primary shadow-sm",
              )}
            >
              {slot.time}
            </button>
          );
        })}
      </div>
    </div>
  );
}
