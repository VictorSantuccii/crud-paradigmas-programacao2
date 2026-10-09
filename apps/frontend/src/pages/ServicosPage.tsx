import { PageShell } from "@/components/layout/PageShell";
import { BookingForm } from "@/components/servicos/BookingForm";
import { BookingStepper } from "@/components/servicos/BookingStepper";
import { ServicePanel } from "@/components/servicos/ServicePanel";
import {
  calendarDays,
  petOptions,
  timeSlots,
} from "@/content/booking-shared";
import { bookingSteps, serviceDetail } from "@/content/servicos";
import { Icon } from "@/components/ui/Icon";
import { Link } from "react-router-dom";

export function ServicosPage() {
  return (
    <PageShell>
      <main className="mx-auto max-w-container-max px-margin-mobile py-12 md:px-margin-desktop md:py-16">
        <BookingStepper steps={bookingSteps} />
        <div className="mb-8">
          <Link
            to="/"
            className="flex items-center gap-2 font-label-md text-secondary-container transition-colors hover:text-secondary"
          >
            <Icon name="arrow_back_ios" />
            Voltar
          </Link>
        </div>
        <div className="flex flex-col overflow-hidden rounded-xl border border-outline-variant/30 bg-surface-container-lowest shadow-[0_10px_25px_rgba(0,93,167,0.05)] lg:flex-row">
          <ServicePanel detail={serviceDetail} />
          <BookingForm
            serviceName={serviceDetail.name}
            price={serviceDetail.price}
            petOptions={petOptions}
            calendarDays={calendarDays}
            timeSlots={timeSlots}
          />
        </div>
      </main>
    </PageShell>
  );
}
