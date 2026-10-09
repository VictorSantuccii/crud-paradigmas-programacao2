import { Icon } from "@/components/ui/Icon";
import type { Testimonial } from "@/content/home";

type TestimonialCardProps = {
  testimonial: Testimonial;
};

function StarRating({ stars }: { stars: number }) {
  const full = Math.floor(stars);
  const half = stars % 1 >= 0.5;
  return (
    <div className="mt-4 flex text-secondary">
      {Array.from({ length: full }).map((_, i) => (
        <Icon key={i} name="star" filled className="text-base" />
      ))}
      {half ? <Icon name="star_half" filled className="text-base" /> : null}
    </div>
  );
}

export function TestimonialCard({ testimonial }: TestimonialCardProps) {
  return (
    <div className="glass-card relative rounded-2xl p-8 soft-shadow">
      <Icon
        name="format_quote"
        className="absolute top-6 right-6 text-4xl text-primary/20"
      />
      <div className="mb-6 flex items-center gap-4">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold ${testimonial.avatarClass}`}
        >
          {testimonial.initial}
        </div>
        <div>
          <h4 className="font-label-md text-on-surface">{testimonial.name}</h4>
          <p className="text-sm text-on-surface-variant">{testimonial.subtitle}</p>
        </div>
      </div>
      <p className="font-body-md text-on-surface-variant italic">
        {testimonial.quote}
      </p>
      <StarRating stars={testimonial.stars} />
    </div>
  );
}
