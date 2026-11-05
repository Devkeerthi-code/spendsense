import Link from "next/link";
import type { ComponentProps } from "react";
import { Spinner } from "./Spinner";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";

const VARIANT: Record<Variant, string> = {
  primary: "bg-ink text-paper hover:bg-ink/85",
  secondary: "border border-line-strong bg-surface text-ink hover:border-ink",
  ghost: "text-ink hover:bg-sunken",
  danger: "bg-danger text-paper hover:bg-danger/85",
};

const SIZE: Record<Size, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-4 text-sm",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md", extra = ""): string {
  return `press inline-flex items-center justify-center gap-2 rounded-md font-medium whitespace-nowrap select-none disabled:cursor-not-allowed disabled:opacity-50 ${VARIANT[variant]} ${SIZE[size]} ${extra}`;
}

interface ButtonProps extends ComponentProps<"button"> {
  variant?: Variant;
  size?: Size;
  pending?: boolean;
}

/** Disabled while pending, so a double tap can never send the same request twice. */
export function Button({ variant, size, pending = false, disabled, className = "", children, type = "button", ...rest }: ButtonProps) {
  return (
    <button
      {...rest}
      type={type}
      disabled={disabled || pending}
      aria-busy={pending || undefined}
      className={buttonClass(variant, size, className)}
    >
      {pending && <Spinner />}
      {children}
    </button>
  );
}

interface LinkButtonProps extends ComponentProps<typeof Link> {
  variant?: Variant;
  size?: Size;
}

export function LinkButton({ variant, size, className = "", ...rest }: LinkButtonProps) {
  return <Link {...rest} className={buttonClass(variant, size, className)} />;
}
