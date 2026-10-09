import { Icon } from "@/components/ui/Icon";

export function PetsHeader() {
  return (
    <section className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
      <div>
        <h1 className="mb-2 font-headline-lg-mobile text-primary md:font-headline-lg">
          Olá, João!
        </h1>
        <p className="font-body-md text-on-surface-variant">
          Gerencie seus pets, agendamentos e histórico.
        </p>
      </div>
      <button
        type="button"
        className="flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-label-md text-on-primary transition-all btn-hover-effect soft-shadow"
      >
        <Icon name="add" />
        Cadastrar Novo Pet
      </button>
    </section>
  );
}
