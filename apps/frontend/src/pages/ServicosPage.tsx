import { BookingForm } from "@/components/servicos/BookingForm";
import { BookingStepper } from "@/components/servicos/BookingStepper";
import { Icon } from "@/components/ui/Icon";
import { PageShell } from "@/components/layout/PageShell";
import { calendarDays, timeSlots } from "@/content/booking-shared";
import { bookingSteps, services } from "@/content/servicos";
import { pets } from "@/content/meus-pets";
import { useState } from "react";
import { Link } from "react-router-dom";

const brl = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function StepHeading({
  number,
  title,
  note,
}: {
  number: number;
  title: string;
  note?: string;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
      <div className="flex items-center gap-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-fixed font-bold text-primary">
          {number}
        </span>
        <h2 className="font-headline-lg text-xl font-bold text-on-surface">
          {title}
        </h2>
      </div>
      {note && <span className="font-label-md text-secondary">{note}</span>}
    </div>
  );
}

export function ServicosPage() {
  const [petId, setPetId] = useState(pets[0]?.id ?? "");
  const [serviceIndex, setServiceIndex] = useState(0);
  const pet = pets.find((item) => item.id === petId);
  const service = services[serviceIndex];

  return (
    <PageShell>
      <main className="pb-16">
        <div className="mb-8 bg-surface-container-low px-margin-mobile py-6 md:px-margin-desktop">
          <BookingStepper steps={bookingSteps} />
        </div>
        <div className="mx-auto w-full max-w-container-max px-margin-mobile md:px-margin-desktop">
          <div className="mb-10">
            <span className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary-fixed px-3 py-1 font-label-md text-primary">
              <Icon name="shower" />
              Cuidado completo para o seu pet
            </span>
            <h1 className="font-display-lg text-3xl leading-tight text-on-surface sm:text-4xl">
              Agendar Serviço
            </h1>
            <p className="mt-2 max-w-2xl text-lg leading-relaxed text-on-surface-variant">
              Escolha o pet e o cuidado ideal. Depois, selecione a data e o
              horário disponíveis.
            </p>
          </div>

          <div className="grid items-start gap-8 lg:grid-cols-12">
            <div className="flex flex-col gap-8 lg:col-span-7">
              <section className="rounded-xl bg-surface-container-lowest p-6 shadow-[0_10px_25px_rgba(0,93,167,0.08)] sm:p-8">
                <StepHeading
                  number={1}
                  title="Qual pet vai receber o cuidado?"
                  note="Obrigatório"
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  {pets.map((item) => (
                    <button
                      type="button"
                      key={item.id}
                      aria-pressed={petId === item.id}
                      onClick={() => setPetId(item.id)}
                      className={`relative flex flex-col items-center rounded-xl p-4 text-center transition sm:items-start sm:text-left ${
                        petId === item.id
                          ? "bg-primary-fixed/70 ring-2 ring-primary"
                          : "bg-surface-container-low hover:bg-surface-container"
                      }`}
                    >
                      <span
                        className={`absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-on-primary ${
                          petId === item.id ? "" : "opacity-0"
                        }`}
                      >
                        <Icon name="check" className="text-sm" />
                      </span>
                      <img
                        src={item.image}
                        alt={item.imageAlt}
                        className="mb-3 h-16 w-16 rounded-full object-cover shadow"
                      />
                      <span className="font-headline-md font-bold text-on-surface">
                        {item.name}
                      </span>
                      <span className="text-sm text-on-surface-variant">
                        {item.speciesLabel} • {item.age}
                      </span>
                      <span className="mt-3 rounded-full bg-tertiary-fixed px-2.5 py-0.5 text-xs font-semibold text-on-tertiary-fixed">
                        Perfil cadastrado
                      </span>
                    </button>
                  ))}
                  <Link
                    to="/meus-pets"
                    className="flex flex-col items-center justify-center rounded-xl bg-surface-container-lowest p-4 text-center transition hover:bg-surface-container-low"
                  >
                    <span className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary-fixed text-primary">
                      <Icon name="add" className="text-2xl" />
                    </span>
                    <span className="font-label-md text-primary">
                      Adicionar novo pet
                    </span>
                    <span className="mt-1 text-xs text-on-surface-variant">
                      Cadastrar ficha
                    </span>
                  </Link>
                </div>
              </section>

              <section className="rounded-xl bg-surface-container-lowest p-6 shadow-[0_10px_25px_rgba(0,93,167,0.08)] sm:p-8">
                <StepHeading
                  number={2}
                  title="Escolha o serviço"
                  note="Selecione um"
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  {services.map((item, index) => (
                    <button
                      key={item.name}
                      type="button"
                      aria-pressed={serviceIndex === index}
                      onClick={() => setServiceIndex(index)}
                      className={`flex items-start gap-4 rounded-xl p-4 text-left transition ${
                        serviceIndex === index
                          ? "bg-primary-fixed/70 ring-2 ring-primary"
                          : "bg-surface-container-low hover:bg-surface-container"
                      }`}
                    >
                      <span
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
                          serviceIndex === index
                            ? "bg-primary text-on-primary"
                            : "bg-primary-fixed text-primary"
                        }`}
                      >
                        <Icon name={item.icon} className="text-2xl" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-start justify-between gap-2">
                          <span className="font-label-md font-bold text-on-surface">
                            {item.name}
                          </span>
                          <span className="shrink-0 font-label-md text-secondary">
                            {brl(item.price)}
                          </span>
                        </span>
                        <span className="mt-1 block text-xs text-on-surface-variant">
                          {item.detail}
                        </span>
                        <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-tertiary-fixed px-2 py-0.5 text-xs text-on-tertiary-fixed">
                          <Icon name="schedule" className="text-xs" />
                          {item.duration}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              </section>
            </div>

            <BookingForm
              serviceName={service.name}
              price={brl(service.price)}
              selectedPet={pet ? `${pet.name} (${pet.speciesLabel})` : "Selecione um pet"}
              calendarDays={calendarDays}
              timeSlots={timeSlots}
            />
          </div>
        </div>
      </main>
    </PageShell>
  );
}
