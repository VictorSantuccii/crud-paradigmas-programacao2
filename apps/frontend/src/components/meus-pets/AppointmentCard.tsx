import { Icon } from "@/components/ui/Icon";
import { upcomingAppointment } from "@/content/meus-pets";

export function AppointmentCard() {
  return (
    <div className="flex flex-col items-center justify-between gap-4 rounded-2xl border border-surface-variant bg-surface-container-lowest p-4 soft-shadow md:flex-row">
      <div className="flex w-full items-center gap-4 md:w-auto">
        <div className="flex min-w-[70px] flex-col items-center justify-center rounded-xl bg-tertiary-container p-3 text-on-tertiary-container">
          <span className="font-label-md uppercase">
            {upcomingAppointment.month}
          </span>
          <span className="font-headline-lg">{upcomingAppointment.day}</span>
        </div>
        <div>
          <h4 className="font-body-lg font-semibold text-on-surface">
            {upcomingAppointment.title}
          </h4>
          <p className="mt-1 flex items-center gap-1 font-body-md text-on-surface-variant">
            <Icon name="schedule" className="text-[16px]" />
            {upcomingAppointment.time}
            <span className="mx-2 text-outline">•</span>
            <span className="font-medium text-primary">
              {upcomingAppointment.petName}
            </span>
          </p>
        </div>
      </div>
      <div className="mt-2 flex w-full gap-2 md:mt-0 md:w-auto">
        <button
          type="button"
          className="flex-1 rounded-full border border-primary px-4 py-2 font-label-md text-primary transition-colors hover:bg-surface-container-low md:flex-none"
        >
          Reagendar
        </button>
        <button
          type="button"
          className="flex-1 rounded-full bg-primary px-4 py-2 font-label-md text-on-primary transition-opacity hover:opacity-90 md:flex-none"
        >
          Detalhes
        </button>
      </div>
    </div>
  );
}
