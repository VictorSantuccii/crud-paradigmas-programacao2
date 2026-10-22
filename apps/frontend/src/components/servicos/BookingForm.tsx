import { BookingSummary } from "@/components/servicos/BookingSummary";
import { MonthCalendar } from "@/components/servicos/MonthCalendar";
import { TimeSlots } from "@/components/servicos/TimeSlots";
import { Icon } from "@/components/ui/Icon";
import type { CalendarDay, TimeSlot } from "@/types/booking";
import { useState } from "react";

type BookingFormProps = {
  serviceName: string;
  price: string;
  selectedPet: string;
  calendarDays: CalendarDay[];
  timeSlots: TimeSlot[];
};

export function BookingForm({
  serviceName,
  price,
  selectedPet,
  calendarDays,
  timeSlots,
}: BookingFormProps) {
  const [selectedDay, setSelectedDay] = useState(24);
  const [selectedTime, setSelectedTime] = useState("10:30");

  return (
    <aside className="flex flex-col gap-6 lg:sticky lg:top-24 lg:col-span-5">
      <section className="rounded-xl bg-surface-container-lowest p-6 shadow-[0_10px_25px_rgba(0,93,167,0.08)] sm:p-8">
        <h2 className="mb-5 flex items-center gap-2 font-headline-md font-bold text-on-surface">
          <Icon name="calendar_month" className="text-primary" />
          Data &amp; Horário
        </h2>
        <MonthCalendar
          days={calendarDays}
          selectedDay={selectedDay}
          onSelectDay={setSelectedDay}
        />
        <TimeSlots
          slots={timeSlots}
          selectedDay={selectedDay}
          selectedTime={selectedTime}
          onSelectTime={setSelectedTime}
        />
      </section>
      <section className="rounded-xl bg-surface-container-lowest p-6 shadow-[0_10px_25px_rgba(0,93,167,0.08)] sm:p-8">
        <BookingSummary
          serviceName={serviceName}
          price={price}
          selectedPet={selectedPet}
          selectedDay={selectedDay}
          selectedTime={selectedTime}
        />
      </section>
    </aside>
  );
}
