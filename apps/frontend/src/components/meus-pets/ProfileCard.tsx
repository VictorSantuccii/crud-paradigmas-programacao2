import { Icon } from "@/components/ui/Icon";
import { profile } from "@/content/meus-pets";

export function ProfileCard() {
  return (
    <section className="rounded-2xl border border-surface-variant bg-surface-container-lowest p-6 soft-shadow">
      <div className="mb-6 flex items-start justify-between">
        <h2 className="font-headline-md text-on-surface">Meu Perfil</h2>
        <button
          type="button"
          className="rounded-full p-2 text-primary transition-colors hover:bg-surface-container"
          title="Editar Perfil"
        >
          <Icon name="edit" />
        </button>
      </div>
      <div className="mb-6 flex flex-col items-center">
        <div className="mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-primary-container font-headline-lg text-on-primary-container">
          {profile.initial}
        </div>
        <h3 className="font-body-lg font-semibold text-on-surface">
          {profile.name}
        </h3>
        <p className="font-body-md text-on-surface-variant">{profile.email}</p>
      </div>
      <div className="space-y-3 border-t border-surface-variant pt-4">
        <div className="flex items-center gap-3 font-body-md text-on-surface-variant">
          <Icon name="phone_iphone" className="text-outline" />
          <span>{profile.phone}</span>
        </div>
        <div className="flex items-center gap-3 font-body-md text-on-surface-variant">
          <Icon name="location_on" className="text-outline" />
          <span>{profile.address}</span>
        </div>
      </div>
    </section>
  );
}
