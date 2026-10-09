import { FeatureCard } from "@/components/home/FeatureCard";
import { Icon } from "@/components/ui/Icon";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { careHighlights } from "@/content/home";
import { Link } from "react-router-dom";

export function ServiceBento() {
  return (
    <section className="mx-auto max-w-container-max px-margin-mobile py-24 md:px-margin-desktop">
      <SectionHeading
        title="Nossos Serviços Especiais"
        description="Soluções completas para a saúde e felicidade do seu melhor amigo."
      />
      <div className="grid auto-rows-[minmax(250px,auto)] grid-cols-1 gap-6 md:grid-cols-3">
        <FeatureCard
          title="Banho e Tosa"
          description="Transforme o visual do seu pet com nossos especialistas. Higiene e muito carinho em cada detalhe."
          icon="water_drop"
          iconClass="bg-tertiary text-on-tertiary"
          className="cursor-pointer bg-tertiary-container/10 transition-colors hover:bg-tertiary-container/20 md:col-span-2"
        >
          <Link
            to="/servicos"
            className="mt-8 flex items-center gap-1 font-label-md text-tertiary transition-all hover:gap-2"
          >
            Agendar <Icon name="arrow_forward" className="text-sm" />
          </Link>
        </FeatureCard>

        <FeatureCard
          title="Consultas Veterinárias"
          description="Cuidando da saúde do seu pet com profissionais experientes e atendimento humanizado."
          icon="stethoscope"
          iconClass="bg-secondary text-on-secondary"
          className="h-full cursor-pointer bg-secondary-container/10 transition-colors hover:bg-secondary-container/20"
        >
          <Link
            to="/consultas"
            className="mt-8 flex items-center gap-1 font-label-md text-secondary transition-all hover:gap-2"
          >
            Marcar Consulta <Icon name="arrow_forward" className="text-sm" />
          </Link>
        </FeatureCard>

        {careHighlights.map((item) => (
          <FeatureCard
            key={item.id}
            title={item.title}
            description={item.description}
            icon={item.icon}
            iconClass={item.iconClass}
            className="cursor-pointer bg-surface-container-low transition-colors hover:bg-surface-container"
          >
            <Link
              to="/consultas"
              className="mt-8 flex items-center gap-1 font-label-md text-primary transition-all hover:gap-2"
            >
              Agendar <Icon name="arrow_forward" className="text-sm" />
            </Link>
          </FeatureCard>
        ))}
      </div>
    </section>
  );
}
