import type { BookingStep } from "@/types/booking";

export const bookingSteps: BookingStep[] = [
  { id: "pet-service", label: "Pet & Serviço", icon: "pets", active: true },
  { id: "date-time", label: "Data & Horário", icon: "calendar_month", active: true },
  { id: "confirmation", label: "Confirmação", icon: "verified", active: false },
];
