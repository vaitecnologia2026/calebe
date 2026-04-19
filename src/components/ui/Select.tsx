import * as React from "react";
import { cn } from "@/lib/cn";

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  error?: string;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
};

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, placeholder, id, className, ...rest }, ref) => {
    const selectId = id ?? rest.name;
    return (
      <div className="flex flex-col">
        {label && (
          <label htmlFor={selectId} className="field-label">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={cn(
            "field-input appearance-none pr-10 bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 20 20%22 fill=%22%23C59B5F%22><path d=%22M5.5 7.5L10 12l4.5-4.5%22 stroke=%22%23C59B5F%22 stroke-width=%221.5%22 fill=%22none%22/></svg>')] bg-no-repeat bg-[right_0.9rem_center]",
            error && "border-red-500/60 focus:border-red-500",
            className
          )}
          aria-invalid={!!error}
          {...rest}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
      </div>
    );
  }
);
Select.displayName = "Select";
