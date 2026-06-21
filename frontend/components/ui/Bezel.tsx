import { cn } from "@/lib/cn";
import { HTMLAttributes } from "react";

interface BezelProps extends HTMLAttributes<HTMLDivElement> {
  glow?: "spot" | "margin" | "predict" | "none";
  innerClassName?: string;
}

const glowMap: Record<string, string> = {
  spot: "before:bg-[radial-gradient(60%_60%_at_50%_0%,rgba(45,212,191,0.18),transparent_70%)]",
  margin: "before:bg-[radial-gradient(60%_60%_at_50%_0%,rgba(139,92,246,0.2),transparent_70%)]",
  predict: "before:bg-[radial-gradient(60%_60%_at_50%_0%,rgba(245,165,36,0.16),transparent_70%)]",
  none: "",
};

export function Bezel({
  className,
  innerClassName,
  glow = "none",
  children,
  ...rest
}: BezelProps) {
  return (
    <div
      className={cn(
        "bezel relative",
        glow !== "none" &&
          "before:absolute before:inset-x-6 before:-top-px before:h-px before:content-[''] before:opacity-80",
        glow !== "none" && glowMap[glow],
        className,
      )}
      {...rest}
    >
      <div className={cn("bezel-core", innerClassName)}>{children}</div>
    </div>
  );
}
