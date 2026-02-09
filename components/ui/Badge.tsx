import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface BadgeProps {
    children: ReactNode;
    variant?: "success" | "neutral" | "warning";
    className?: string;
}

export function Badge({ children, variant = "neutral", className }: BadgeProps) {
    return (
        <span
            className={cn(
                "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                variant === "success" && "bg-camfit-green/20 text-emerald-800",
                variant === "neutral" && "bg-gray-100 text-gray-700",
                variant === "warning" && "bg-yellow-100 text-yellow-800",
                className
            )}
        >
            {children}
        </span>
    );
}
