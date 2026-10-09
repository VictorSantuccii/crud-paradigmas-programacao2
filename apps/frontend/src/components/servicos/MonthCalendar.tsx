import { Icon } from "@/components/ui/Icon";
import type { CalendarDay } from "@/types/booking";
import { cn } from "@/lib/cn";

type MonthCalendarProps = {
  days: CalendarDay[];
  selectedDay: number;
  onSelectDay: (day: number) => void;
};

const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export function MonthCalendar({
  days,
  selectedDay,
  onSelectDay,
}: MonthCalendarProps) {
  return (
    <div>
      <span className="mb-4 block font-label-md text-on-surface-variant">
        Escolha a data
      </span>
      <div className="rounded-xl border border-outline-variant bg-surface p-4">
        <div className="mb-4 flex items-center justify-between">
          <button
            type="button"
            className="p-1 text-on-surface-variant transition-colors hover:text-primary"
            aria-label="Mês anterior"
          >
            <Icon name="chevron_left" />
          </button>
          <span className="font-label-md font-bold text-on-surface">
            Outubro 2023
          </span>
          <button
            type="button"
            className="p-1 text-on-surface-variant transition-colors hover:text-primary"
            aria-label="Próximo mês"
          >
            <Icon name="chevron_right" />
          </button>
        </div>
        <div className="mb-2 grid grid-cols-7 gap-1 text-center">
          {weekDays.map((d) => (
            <span key={d} className="text-[12px] font-label-md text-outline">
              {d}
            </span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1 text-center font-body-md md:gap-2">
          {days.map((cell) => (
            <button
              key={cell.day}
              type="button"
              disabled={cell.disabled}
              onClick={() => !cell.disabled && onSelectDay(cell.day)}
              className={cn(
                "relative rounded-full py-2 transition-colors",
                cell.disabled && "text-outline-variant",
                !cell.disabled &&
                  selectedDay !== cell.day &&
                  "hover:bg-surface-container-high",
                selectedDay === cell.day &&
                  "scale-105 bg-primary font-bold text-on-primary shadow-md",
              )}
            >
              {cell.day}
              {cell.dot ? (
                <span className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-secondary-container" />
              ) : null}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
