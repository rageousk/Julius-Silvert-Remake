"use client";

import { digitsOnly, formatUSPhoneDisplay } from "@/lib/phone";

type Props = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
  autoComplete?: string;
  "aria-invalid"?: boolean;
};

/**
 * Controlled input: `value` is raw digits only (max 10). Display is (XXX) XXX-XXXX.
 */
export function PhoneInput({
  id,
  value,
  onChange,
  className = "",
  placeholder = "(215) 555-1234",
  disabled,
  autoComplete = "tel",
  "aria-invalid": ariaInvalid,
}: Props) {
  const display = formatUSPhoneDisplay(value);

  function apply(raw: string) {
    onChange(digitsOnly(raw));
  }

  return (
    <input
      id={id}
      type="tel"
      inputMode="numeric"
      autoComplete={autoComplete}
      className={className}
      placeholder={placeholder}
      disabled={disabled}
      aria-invalid={ariaInvalid}
      value={display}
      onChange={(e) => apply(e.target.value)}
      onPaste={(e) => {
        e.preventDefault();
        const t = e.clipboardData.getData("text");
        apply(t);
      }}
    />
  );
}
