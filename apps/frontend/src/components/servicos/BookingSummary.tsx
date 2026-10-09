import { Icon } from "@/components/ui/Icon";

type BookingSummaryProps = {
  serviceName: string;
  price: string;
  selectedDay: number;
  selectedTime: string;
};

export function BookingSummary({
  serviceName,
  price,
  selectedDay,
  selectedTime,
}: BookingSummaryProps) {
  return (
    <div className="mt-8 rounded-xl border border-outline-variant/30 bg-surface p-6">
      <div className="mb-2 flex items-center justify-between">
        <span className="font-body-md text-on-surface-variant">Serviço</span>
        <span className="font-label-md font-bold text-on-surface">
          {serviceName}
        </span>
      </div>
      <div className="mb-4 flex items-center justify-between">
        <span className="font-body-md text-on-surface-variant">Data e Hora</span>
        <span className="font-label-md text-on-surface">
          {selectedDay} Out, {selectedTime}
        </span>
      </div>
      <hr className="mb-4 border-outline-variant/30" />
      <div className="mb-6 flex items-end justify-between">
        <span className="font-headline-md font-bold text-on-surface">Total</span>
        <span className="font-headline-lg-mobile font-bold text-secondary-container">
          {price}
        </span>
      </div>
      <button
        type="button"
        className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-4 font-label-md font-bold text-on-primary shadow-[0_4px_14px_rgba(0,93,167,0.3)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-surface-tint active:translate-y-0 active:shadow-sm"
      >
        Avançar para Pagamento
        <Icon name="arrow_forward" className="text-[20px]" />
      </button>
    </div>
  );
}
