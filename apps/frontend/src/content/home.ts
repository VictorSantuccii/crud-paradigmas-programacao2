export const heroContent = {
  title: "Tudo o que Seu Pet Precisa em um Só Lugar!",
  description:
    "Serviços e consultas com cuidado e amor. Toda comodidade que você busca, com a qualidade que ele merece.",
  image:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuAYTVbTk2ez8FAnz83pMU_u_s-zYfjs-gVpqrRXnH-dVoz5dL9x90UJSnNjsOlzB70NDRXTcCbauU8ybvea1oQAfmeN1sppdZRXl1rSHprZKu-DCoUfKew0iYtlX7ZNlXDsWqqZpEFnSk8LMp1U4DodSl3Esf5mtRem8Bk40QeLYl3pSveiPN0XTI65dOTpXDPH0bNiX5wOxhu61-kFANr6i_xq3lSs0YPpI549JUP7fz8Z9FsuP3qvcwYllw6ZOKzQPQ-J-aLtm7Ns",
  imageAlt: "Cão sorridente",
};

export type CareHighlight = {
  id: string;
  title: string;
  description: string;
  icon: string;
  iconClass: string;
};

export const careHighlights: CareHighlight[] = [
  {
    id: "rotina",
    title: "Consulta de rotina",
    description:
      "Check-up periódico para manter vacinas, peso e bem-estar em dia.",
    icon: "health_and_safety",
    iconClass: "bg-primary text-on-primary",
  },
  {
    id: "vacina",
    title: "Vacinação",
    description:
      "Calendário vacinal atualizado com orientação clara para tutores.",
    icon: "vaccines",
    iconClass: "bg-secondary text-on-secondary",
  },
  {
    id: "acompanhamento",
    title: "Acompanhamento",
    description:
      "Retorno e monitoramento após consultas para evolução segura do tratamento.",
    icon: "monitor_heart",
    iconClass: "bg-tertiary text-on-tertiary",
  },
];

export type Testimonial = {
  id: string;
  initial: string;
  name: string;
  subtitle: string;
  quote: string;
  stars: number;
  avatarClass: string;
};

export const testimonials: Testimonial[] = [
  {
    id: "mariana",
    initial: "M",
    name: "Mariana Silva",
    subtitle: "Tutora da Luna (Golden)",
    quote:
      '"A equipe do PetExpress é maravilhosa! A Luna adora o dia de banho, volta sempre cheirosa e super feliz. O agendamento pelo site é muito prático."',
    stars: 5,
    avatarClass: "bg-primary-container text-on-primary-container",
  },
  {
    id: "carlos",
    initial: "C",
    name: "Carlos Eduardo",
    subtitle: "Tutor do Thor (Bulldog)",
    quote:
      '"A consulta veterinária foi excelente. O Dr. explicou tudo com muita calma e o Thor sempre recebe um atendimento atencioso."',
    stars: 4.5,
    avatarClass: "bg-secondary-container text-on-secondary-container",
  },
  {
    id: "ana",
    initial: "A",
    name: "Ana Luiza",
    subtitle: "Tutora da Mia (Gato)",
    quote:
      '"Achei o aplicativo incrível para organizar as vacinas da Mia. O ambiente da clínica é muito acolhedor, não parece hospital, a Mia ficou super calma."',
    stars: 5,
    avatarClass: "bg-tertiary-container text-on-tertiary-container",
  },
];
