import { Icon } from "@/components/ui/Icon";
import type { ServiceDetail } from "@/types/booking";

type ServicePanelProps = {
  detail: ServiceDetail;
};

export function ServicePanel({ detail }: ServicePanelProps) {
  return (
    <div className="flex w-full flex-col bg-surface-container-low p-6 md:p-10 lg:w-5/12">
      <div className="relative mb-6 h-64 overflow-hidden rounded-xl bg-surface-container-high">
        <img
          src={detail.image}
          alt={detail.imageAlt}
          className="h-full w-full object-cover"
        />
      </div>
      <div className="mb-4 flex items-start justify-between">
        <h1 className="font-headline-lg-mobile font-bold text-primary md:font-headline-lg">
          {detail.name}
        </h1>
        <div className="flex items-center gap-1 rounded-full bg-tertiary-container px-3 py-1 font-label-md text-on-tertiary shadow-sm">
          <Icon name="schedule" className="text-[16px]" />
          {detail.duration}
        </div>
      </div>
      <p className="mb-6 font-body-md text-on-surface-variant">
        {detail.description}
      </p>
      <div className="mt-auto space-y-2">
        {detail.perks.map((perk) => (
          <div key={perk} className="flex items-center gap-3 text-on-surface">
            <Icon name="check_circle" className="text-primary" />
            <span className="font-body-md">{perk}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
