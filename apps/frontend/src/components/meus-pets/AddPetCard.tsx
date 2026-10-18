import { Icon } from "@/components/ui/Icon";

export function AddPetCard() {
  return (
    <button
      type="button"
      className="flex min-h-[220px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-outline-variant bg-surface-container-low p-6 transition-all duration-300 hover:border-primary hover:bg-surface-container group"
    >
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-surface transition-transform group-hover:scale-110">
        <Icon name="add" className="text-3xl text-primary" />
      </div>
      <span className="font-headline-md text-primary">Novo Pet</span>
      <span className="mt-2 font-body-md text-on-surface-variant">
        Clique para cadastrar
      </span>
    </button>
  );
}
