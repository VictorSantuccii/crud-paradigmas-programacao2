import { TestimonialCard } from "@/components/home/TestimonialCard";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { testimonials } from "@/content/home";

export function Testimonials() {
  return (
    <section className="bg-surface-container-lowest px-margin-mobile py-24 md:px-margin-desktop">
      <div className="mx-auto max-w-container-max">
        <SectionHeading
          title="O que dizem sobre nós"
          description="A satisfação dos nossos clientes é a nossa maior recompensa."
        />
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {testimonials.map((item) => (
            <TestimonialCard key={item.id} testimonial={item} />
          ))}
        </div>
      </div>
    </section>
  );
}
