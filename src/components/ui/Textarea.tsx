import * as React from "react";
import { cn } from "@/lib/cn";

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  hint?: string;
  error?: string;
};

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, hint, error, id, className, ...rest }, ref) => {
    const taId = id ?? rest.name;
    return (
      <div className="flex flex-col">
        {label && (
          <label htmlFor={taId} className="field-label">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={taId}
          rows={rest.rows ?? 4}
          className={cn(
            "field-input resize-none leading-relaxed",
            error && "border-danger/60 focus:border-danger",
            className
          )}
          aria-invalid={!!error}
          {...rest}
        />
        {hint && !error && <p className="mt-1.5 text-xs text-sand-100/40">{hint}</p>}
        {error && <p className="mt-1.5 text-xs text-danger">{error}</p>}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";
