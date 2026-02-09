import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface GlassCardProps {
    children: ReactNode;
    className?: string;
    hoverEffect?: boolean;
}

export function GlassCard({ children, className, hoverEffect = false }: GlassCardProps) {
    return (
        <div
            className={cn(
                "rounded-2xl glass-effect p-6 transition-all duration-300",
                hoverEffect && "glass-card-hover cursor-pointer",
                className
            )}
        >
            {children}
        </div>
    );
}
