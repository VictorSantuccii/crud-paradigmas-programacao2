import { Icon } from "@/components/ui/Icon";

type SelectFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
};

export function SelectField({
  id,
  label,
  value,
  onChange,
  options,
}: SelectFieldProps) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block font-label-md text-on-surface-variant"
      >
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full cursor-pointer appearance-none rounded-lg border border-outline bg-surface px-4 py-3 font-body-md text-on-surface transition-shadow focus:border-primary focus:ring-2 focus:ring-primary focus:outline-none"
        >
          <option disabled value="">Selecione um pet</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-on-surface-variant">
          <Icon name="expand_more" />
        </div>
      </div>
    </div>
  );
}
