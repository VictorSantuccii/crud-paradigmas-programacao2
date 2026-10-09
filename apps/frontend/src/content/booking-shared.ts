import type { CalendarDay, PetOption, TimeSlot } from "@/types/booking";

export const petOptions: PetOption[] = [
  { value: "thor", label: "Thor (Golden Retriever)" },
  { value: "luna", label: "Luna (Gato Persa)" },
  { value: "novo", label: "+ Adicionar novo pet" },
];

export const calendarDays: CalendarDay[] = [
  { day: 1, disabled: true },
  { day: 2, disabled: true },
  { day: 3, disabled: false },
  { day: 4, disabled: false },
  { day: 5, disabled: false },
  { day: 6, disabled: false, dot: true },
  { day: 7, disabled: false },
  { day: 8, disabled: false },
  { day: 9, disabled: false },
  { day: 10, disabled: false },
  { day: 11, disabled: false },
  { day: 12, disabled: false },
  { day: 13, disabled: false },
  { day: 14, disabled: false },
];

export const timeSlots: TimeSlot[] = [
  { time: "09:00", available: true },
  { time: "10:30", available: true },
  { time: "14:00", available: false },
  { time: "15:30", available: true },
  { time: "16:00", available: true },
  { time: "17:30", available: true },
];
