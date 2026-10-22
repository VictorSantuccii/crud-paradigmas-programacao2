import type { BookingStep } from "@/types/booking";

export const services = [
  {
    name: "Banho Simples",
    detail: "Banho relaxante com produtos adequados para a pelagem do pet.",
    price: 80,
    duration: "45 min",
    icon: "water_drop",
  },
  {
    name: "Tosa Higiênica",
    detail: "Aparos cuidadosos nas regiões que precisam de higiene extra.",
    price: 70,
    duration: "40 min",
    icon: "content_cut",
  },
  {
    name: "Banho e Tosa Completa",
    detail: "Banho, secagem e tosa completa para renovar o visual.",
    price: 120,
    duration: "90 min",
    icon: "shower",
  },
];

export const bookingSteps: BookingStep[] = [
  { id: "pet-service", label: "Pet & Serviço", icon: "pets", active: true },
  { id: "date-time", label: "Data & Horário", icon: "calendar_month", active: true },
  { id: "confirmation", label: "Confirmação", icon: "verified", active: false },
];
