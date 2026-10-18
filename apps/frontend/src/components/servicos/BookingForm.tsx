import { BookingSummary } from "@/components/servicos/BookingSummary";
import { MonthCalendar } from "@/components/servicos/MonthCalendar";
import { SelectField } from "@/components/servicos/SelectField";
import { TimeSlots } from "@/components/servicos/TimeSlots";
import type { CalendarDay, PetOption, TimeSlot } from "@/types/booking";
import { useState } from "react";

type BookingFormProps = {
  serviceName: string;
  price: string;
  petOptions: PetOption[];
  calendarDays: CalendarDay[];
  timeSlots: TimeSlot[];
};

export function BookingForm({
  serviceName,
  price,
  petOptions,
  calendarDays,
  timeSlots,
}: BookingFormProps) {
  const [petId, setPetId] = useState("");
  const [selectedDay, setSelectedDay] = useState(11);
  const [selectedTime, setSelectedTime] = useState("10:30");

  return (
    <div className="flex w-full flex-col bg-surface-container-lowest p-6 md:p-10 lg:w-7/12">
      <h2 className="mb-6 font-headline-md font-bold text-on-surface">
        Detalhes do Agendamento
      </h2>
      <form className="flex flex-1 flex-col space-y-8">
        <SelectField
          id="pet-select"
          label="Para qual pet?"
          value={petId}
          onChange={setPetId}
          options={petOptions}
        />
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
        <div className="grow" />
        <BookingSummary
          serviceName={serviceName}
          price={price}
          selectedDay={selectedDay}
          selectedTime={selectedTime}
        />
      </form>
    </div>
  );
}
