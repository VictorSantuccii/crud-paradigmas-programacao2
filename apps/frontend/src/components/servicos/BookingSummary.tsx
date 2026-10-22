import { Icon } from "@/components/ui/Icon";

type BookingSummaryProps = {
  serviceName: string;
  price: string;
  selectedPet: string;
  selectedDay: number;
  selectedTime: string;
};

export function BookingSummary({
  serviceName,
  price,
  selectedPet,
  selectedDay,
  selectedTime,
}: BookingSummaryProps) {
  return (
    <div>
      <h2 className="mb-5 font-headline-md font-bold text-on-surface">
        Resumo do Agendamento
      </h2>
      <dl className="space-y-4 text-sm">
      <div className="flex justify-between gap-3">
        <dt className="text-on-surface-variant">Pet</dt>
        <dd className="text-right font-bold text-on-surface">{selectedPet}</dd>
      </div>
      <div className="flex justify-between gap-3">
        <dt className="text-on-surface-variant">Serviço</dt>
        <dd className="text-right font-bold text-on-surface">
          {serviceName}
        </dd>
      </div>
      <div className="flex justify-between gap-3">
        <dt className="text-on-surface-variant">Data e horário</dt>
        <dd className="text-right font-bold text-primary">
          {selectedDay} Out, {selectedTime}
        </dd>
      </div>
      </dl>
      <div className="my-5 border-t border-dashed border-outline-variant" />
      <div className="flex items-center justify-between">
        <span className="font-label-md text-on-surface-variant">Valor do serviço</span>
        <span className="font-headline-md text-xl font-bold text-secondary">
          {price}
        </span>
      </div>
      <button
        type="button"
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-4 font-headline-md font-bold text-on-primary shadow-lg transition hover:bg-primary-container"
      >
        <Icon name="check_circle" />
        Avançar para Pagamento
        <Icon name="arrow_forward" className="text-[20px]" />
      </button>
      <p className="mt-3 flex items-center justify-center gap-1 text-center text-xs text-on-surface-variant">
        <Icon name="lock" />
        Pagamento seguro no local após o atendimento.
      </p>
    </div>
  );
}
