"use client";

import { zipDigitsOnly } from "@/lib/input-security";

type Props = {
  id?: string;
  value: string;
  onChange: (digits: string) => void;
  className?: string;
  disabled?: boolean;
  placeholder?: string;
  "aria-invalid"?: boolean;
};

/** US ZIP: exactly 5 digits; display is plain digits (no formatting). */
export function ZipInput({
  id,
  value,
  onChange,
  className = "",
  disabled,
  placeholder = "08028",
  "aria-invalid": ariaInvalid,
}: Props) {
  return (
    <input
      id={id}
      type="text"
      inputMode="numeric"
      pattern="\d{5}"
      maxLength={5}
      autoComplete="postal-code"
      className={className}
      placeholder={placeholder}
      disabled={disabled}
      aria-invalid={ariaInvalid}
      value={value}
      onChange={(e) => onChange(zipDigitsOnly(e.target.value))}
      onPaste={(e) => {
        e.preventDefault();
        onChange(zipDigitsOnly(e.clipboardData.getData("text")));
      }}
    />
  );
}
