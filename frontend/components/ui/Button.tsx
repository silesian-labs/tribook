"use client";

import { cn } from "@/lib/cn";
import { ArrowUpRight } from "@phosphor-icons/react";
import { ButtonHTMLAttributes, forwardRef, ReactNode } from "react";

type Variant = "primary" | "glass" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  trailingIcon?: boolean;
  icon?: ReactNode;
  full?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", trailingIcon, icon, full, className, children, ...rest },
  ref,
) {
  const base =
    "group relative inline-flex items-center justify-center gap-2 rounded-full font-medium select-none " +
    "transition-[transform,background-color,box-shadow] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] " +
    "active:scale-[0.97] disabled:opacity-40 disabled:pointer-events-none " +
    (trailingIcon || icon ? "pl-6 pr-1.5 py-1.5" : "px-6 py-3");

  const variants: Record<Variant, string> = {
    primary:
      "bg-white text-black shadow-[0_8px_30px_-8px_rgba(255,255,255,0.35)] hover:shadow-[0_10px_40px_-8px_rgba(45,212,191,0.5)]",
    glass:
      "glass text-white hover:bg-white/[0.08] shadow-[inset_0_1px_1px_rgba(255,255,255,0.12)]",
    ghost: "text-white/70 hover:text-white",
  };

  const iconWrapTone =
    variant === "primary"
      ? "bg-black/[0.08] text-black"
      : "bg-white/10 text-white";

  return (
    <button
      ref={ref}
      className={cn(base, variants[variant], full && "w-full", className)}
      {...rest}
    >
      <span className="text-[15px] leading-none">{children}</span>
      {(trailingIcon || icon) && (
        <span
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-full transition-transform duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]",
            "group-hover:translate-x-0.5 group-hover:-translate-y-[1px] group-hover:scale-105",
            iconWrapTone,
          )}
        >
          {icon ?? <ArrowUpRight weight="bold" className="h-4 w-4" />}
        </span>
      )}
    </button>
  );
});
