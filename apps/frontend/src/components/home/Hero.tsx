import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { heroContent } from "@/content/home";
import { Link } from "react-router-dom";

export function Hero() {
  return (
    <section className="relative w-full overflow-hidden bg-surface-container-low px-margin-mobile pt-12 pb-24 md:px-margin-desktop md:pt-24 md:pb-32">
      <div className="mx-auto grid max-w-container-max grid-cols-1 items-center gap-12 md:grid-cols-2">
        <div className="z-10">
          <h1 className="mb-6 font-headline-lg-mobile text-on-surface md:font-display-lg md:text-display-lg">
            {heroContent.title}
          </h1>
          <p className="mb-8 max-w-lg font-body-lg text-on-surface-variant">
            {heroContent.description}
          </p>
          <div className="flex flex-col gap-4 sm:flex-row">
            <Link to="/servicos">
              <Button className="w-full sm:w-auto">
                Agendar Agora
                <Icon name="calendar_month" className="text-sm" />
              </Button>
            </Link>
            <Link to="/meus-pets">
              <Button variant="outline" className="w-full sm:w-auto">
                Meus Pets
              </Button>
            </Link>
          </div>
        </div>
        <div className="relative h-[400px] w-full overflow-hidden rounded-[2rem] soft-shadow md:h-[600px]">
          <img
            src={heroContent.image}
            alt={heroContent.imageAlt}
            className="absolute inset-0 h-full w-full object-cover object-center"
          />
          <div className="absolute -bottom-6 -left-6 h-32 w-32 rounded-full bg-secondary-container opacity-50 mix-blend-multiply blur-2xl" />
          <div className="absolute -top-6 -right-6 h-40 w-40 rounded-full bg-tertiary-container opacity-30 mix-blend-multiply blur-2xl" />
        </div>
      </div>
    </section>
  );
}
