import type { CalendarDay, PetOption, TimeSlot } from "@/types/booking";

export const petOptions: PetOption[] = [
  { value: "thor", label: "Thor (Golden Retriever)" },
  { value: "luna", label: "Luna (Gato Persa)" },
  { value: "novo", label: "+ Adicionar novo pet" },
];

export const calendarDays: CalendarDay[] = Array.from(
  { length: 31 },
  (_, index) => ({
    day: index + 1,
    disabled: index + 1 < 23,
    dot: [24, 27, 30].includes(index + 1),
  }),
);

export const timeSlots: TimeSlot[] = [
  { time: "09:00", available: true },
  { time: "10:30", available: true },
  { time: "14:00", available: false },
  { time: "15:30", available: true },
  { time: "16:00", available: true },
  { time: "17:30", available: true },
];
