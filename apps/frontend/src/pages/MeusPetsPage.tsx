import { PageShell } from "@/components/layout/PageShell";
import { AddPetCard } from "@/components/meus-pets/AddPetCard";
import { AppointmentCard } from "@/components/meus-pets/AppointmentCard";
import { HistoryList } from "@/components/meus-pets/HistoryList";
import { PetCard } from "@/components/meus-pets/PetCard";
import { PetsHeader } from "@/components/meus-pets/PetsHeader";
import { ProfileCard } from "@/components/meus-pets/ProfileCard";
import { Icon } from "@/components/ui/Icon";
import { pets } from "@/content/meus-pets";

export function MeusPetsPage() {
  return (
    <PageShell className="pb-20">
      <main className="mx-auto mt-8 max-w-container-max space-y-12 px-margin-mobile md:mt-16 md:px-margin-desktop">
        <PetsHeader />

        <section>
          <div className="mb-6 flex items-center justify-between border-b border-surface-variant pb-2">
            <h2 className="flex items-center gap-2 font-headline-md text-on-surface">
              <Icon name="pets" className="text-secondary" />
              Meus Pets
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {pets.map((pet) => (
              <PetCard key={pet.id} pet={pet} />
            ))}
            <AddPetCard />
          </div>
        </section>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="space-y-8 lg:col-span-2">
            <section>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="flex items-center gap-2 font-headline-md text-on-surface">
                  <Icon name="calendar_month" className="text-tertiary" />
                  Próximos Agendamentos
                </h2>
                <a
                  href="#"
                  className="font-label-md text-primary hover:underline"
                >
                  Ver todos
                </a>
              </div>
              <AppointmentCard />
            </section>

            <section>
              <h2 className="mb-4 flex items-center gap-2 font-headline-md text-on-surface">
                <Icon name="history" className="text-primary" />
                Histórico Recente
              </h2>
              <HistoryList />
            </section>
          </div>

          <div>
            <ProfileCard />
          </div>
        </div>
      </main>
    </PageShell>
  );
}
