import { Hero } from "@/components/home/Hero";
import { ServiceBento } from "@/components/home/ServiceBento";
import { Testimonials } from "@/components/home/Testimonials";
import { PageShell } from "@/components/layout/PageShell";

export function HomePage() {
  return (
    <PageShell>
      <main>
        <Hero />
        <ServiceBento />
        <Testimonials />
      </main>
    </PageShell>
  );
}
