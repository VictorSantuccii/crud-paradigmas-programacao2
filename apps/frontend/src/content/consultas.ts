import type { BookingStep, ServiceDetail } from "@/types/booking";

export const consultationDetail: ServiceDetail = {
  name: "Consulta Veterinária",
  duration: "~ 30 min",
  price: "R$ 180,00",
  description:
    "Avaliação clínica completa com veterinários experientes e atendimento humanizado. Ideal para check-ups de rotina, sintomas leves ou acompanhamento da saúde do seu pet em um ambiente acolhedor.",
  image:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuBYPnaRWUeWV_3j-eXgZWFK6F_au2wc_X4pXbIZIZNUb5ECllp7e6M17C1YVs5UTt5zx2pi-jqXKlKMUafhw-vBkq-H6UG2p7yMkb3JYjj8MTUCVgIwiwlQ6en7jgvgDtnXNGtIQUFe-C-xmK6jNKqDt_MdPod0dEXO8l0eOgX1TM-JJczJleM1uST_l8JpTI7cTSCATYx9ZaoxyGDNDSVhMiKa2Nv0d17yAEHEt684-YwM9IEDzPXwnM2XSf84U8Gqvowll94cMemu",
  imageAlt: "Veterinário examinando um cachorro",
  perks: [
    "Exame clínico completo",
    "Orientação de vacinas",
    "Retorno em até 7 dias",
  ],
};

export const consultationBookingSteps: BookingStep[] = [
  { id: "pet", label: "Pet", icon: "pets", active: false },
  { id: "consultation", label: "Consulta", icon: "stethoscope", active: true },
  { id: "time", label: "Horário", icon: "calendar_today", active: false },
  { id: "payment", label: "Pagamento", icon: "payment", active: false },
];
