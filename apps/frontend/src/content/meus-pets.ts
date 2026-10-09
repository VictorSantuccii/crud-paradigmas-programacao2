export type Pet = {
  id: string;
  name: string;
  speciesLabel: string;
  badgeClass: string;
  badgeBg: string;
  age: string;
  weight: string;
  image: string;
  imageAlt: string;
  gradient: string;
};

export const pets: Pet[] = [
  {
    id: "thor",
    name: "Thor",
    speciesLabel: "Cachorro • Golden",
    badgeClass: "text-primary",
    badgeBg: "bg-primary-fixed",
    age: "3 anos",
    weight: "25 kg",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBYPnaRWUeWV_3j-eXgZWFK6F_au2wc_X4pXbIZIZNUb5ECllp7e6M17C1YVs5UTt5zx2pi-jqXKlKMUafhw-vBkq-H6UG2p7yMkb3JYjj8MTUCVgIwiwlQ6en7jgvgDtnXNGtIQUFe-C-xmK6jNKqDt_MdPod0dEXO8l0eOgX1TM-JJczJleM1uST_l8JpTI7cTSCATYx9ZaoxyGDNDSVhMiKa2Nv0d17yAEHEt684-YwM9IEDzPXwnM2XSf84U8Gqvowll94cMemu",
    imageAlt: "Foto do cachorro Thor",
    gradient: "from-primary-fixed to-surface-bright",
  },
  {
    id: "miau",
    name: "Miau",
    speciesLabel: "Gato • SRD",
    badgeClass: "text-secondary",
    badgeBg: "bg-secondary-fixed",
    age: "1 ano e 2 meses",
    weight: "4.5 kg",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuATvIVyCbNJRbhEctcv-rrzXljKYxhhbpmaC5i90nzqG-C4y9T2zfXVLsGNMUVH4STOiujoFXlOXPWWTsoIudJpV5HR-t_23TKDOori1I74QTv5MM9jkQa54G3sJWfCnvbmV8y-UJPhpu7sEkohWUhG0VxjUqme9_zQsgUpGBWpqNhgs25EsaaWb-kWBfe0pqwvrq6vR4R6I39we2R6uKlBIpXL-_PD9tZaSXYZL6mHnK1-BVYQq9X-oqrOGCr2NHk5erSzwnmf77vl",
    imageAlt: "Foto do gato Miau",
    gradient: "from-secondary-fixed to-surface-bright",
  },
];

export const upcomingAppointment = {
  month: "Out",
  day: 15,
  title: "Banho e Tosa Completa",
  time: "14:00 - 15:30",
  petName: "Thor",
};

export const historyItems = [
  {
    id: "1",
    icon: "vaccines",
    title: "Consulta de Rotina + Vacina V10",
    subtitle: "28 Set 2023 • Dr. Carlos",
    status: "Concluído",
  },
  {
    id: "2",
    icon: "water_drop",
    title: "Banho Simples",
    subtitle: "15 Set 2023 • Loja Centro",
    status: "Concluído",
  },
];

export const profile = {
  initial: "J",
  name: "João da Silva",
  email: "joao.silva@email.com",
  phone: "(11) 98765-4321",
  address: "Rua das Flores, 123 - SP",
};
