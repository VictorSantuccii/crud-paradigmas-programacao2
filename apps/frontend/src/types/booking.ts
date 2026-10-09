export type ServiceDetail = {
  name: string;
  duration: string;
  price: string;
  description: string;
  image: string;
  imageAlt: string;
  perks: string[];
};

export type BookingStep = {
  id: string;
  label: string;
  icon: string;
  active: boolean;
};

export type CalendarDay = {
  day: number;
  disabled?: boolean;
  dot?: boolean;
};

export type TimeSlot = {
  time: string;
  available: boolean;
};

export type PetOption = {
  value: string;
  label: string;
};
