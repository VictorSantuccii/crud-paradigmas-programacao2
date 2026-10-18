import type { BookingStep, ServiceDetail } from "@/types/booking";

export const serviceDetail: ServiceDetail = {
  name: "Banho e Tosa",
  duration: "~ 60 min",
  price: "R$ 120,00",
  description:
    "Mime o seu melhor amigo com um banho relaxante e uma tosa impecável. Utilizamos cuidados de higiene adequados para o tipo de pelagem do seu pet, garantindo saúde e muito charme. Nossos profissionais são treinados para proporcionar uma experiência tranquila e segura.",
  image:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuDwtlSdFkdcyCvhMr43wQlnaWxkjtsuGb2Zrn20ccVa3962WI6Hc48bjLzfVkCO26_Yq7olVjX7Zb4Tgbv3lWXbVvKqgB6j2dNL3V1xGqB_dso-rNAYPw6XAhu3jdxJ29A-SgJbwahRZCqWGlUCnrzlqAKu79X7adqovb0mq9CMFkyXDh94ltpsoHk4EFWRQYOo_VnBMb1DNoI5lBQeFTRIuxdyRBjVg6aXzaklkB1jlG7XwO-H77JiG_DYVQQTwxNmBYLYNVVcTt3H",
  imageAlt: "Cachorro tomando banho",
  perks: ["Corte de unhas incluso", "Limpeza de ouvidos"],
};

export const bookingSteps: BookingStep[] = [
  { id: "pet", label: "Pet", icon: "pets", active: false },
  { id: "service", label: "Serviço", icon: "shower", active: true },
  { id: "time", label: "Horário", icon: "calendar_today", active: false },
  { id: "payment", label: "Pagamento", icon: "payment", active: false },
];
