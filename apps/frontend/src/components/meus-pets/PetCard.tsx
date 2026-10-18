import { Icon } from "@/components/ui/Icon";
import type { Pet } from "@/content/meus-pets";
import { cn } from "@/lib/cn";

type PetCardProps = {
  pet: Pet;
};

export function PetCard({ pet }: PetCardProps) {
  return (
    <div className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-surface-variant bg-surface-container-lowest p-6 soft-shadow card-hover transition-all duration-300">
      <div
        className={cn(
          "absolute top-0 left-0 -z-10 h-24 w-full bg-gradient-to-br opacity-50 transition-opacity group-hover:opacity-100",
          pet.gradient,
        )}
      />
      <div className="z-10 mb-4 flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full border-2 border-surface bg-surface-container-high shadow-sm">
            <img
              src={pet.image}
              alt={pet.imageAlt}
              className="h-full w-full object-cover"
            />
          </div>
          <div>
            <h3 className="font-headline-md text-on-surface">{pet.name}</h3>
            <p
              className={cn(
                "mt-1 inline-block rounded-full px-2 py-1 font-label-md",
                pet.badgeClass,
                pet.badgeBg,
              )}
            >
              {pet.speciesLabel}
            </p>
          </div>
        </div>
        <button
          type="button"
          className="text-on-surface-variant transition-colors hover:text-primary"
          aria-label={`Opções de ${pet.name}`}
        >
          <Icon name="more_vert" />
        </button>
      </div>
      <div className="z-10 mt-2 grow space-y-3">
        <div className="flex items-center gap-2 font-body-md text-on-surface-variant">
          <Icon name="cake" className="text-[20px] text-outline" />
          <span>{pet.age}</span>
        </div>
        <div className="flex items-center gap-2 font-body-md text-on-surface-variant">
          <Icon name="scale" className="text-[20px] text-outline" />
          <span>{pet.weight}</span>
        </div>
      </div>
      <div className="z-10 mt-6 border-t border-surface-variant pt-4">
        <button
          type="button"
          className="w-full py-2 text-center font-label-md text-primary hover:underline"
        >
          Ver Perfil Completo
        </button>
      </div>
    </div>
  );
}
