import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "outline" | "ghost";
    isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, children, variant = "primary", isLoading, disabled, ...props }, ref) => {
        return (
            <button
                ref={ref}
                disabled={disabled || isLoading}
                className={cn(
                    "inline-flex items-center justify-center rounded-xl px-6 py-3 text-sm font-bold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed",
                    variant === "primary" &&
                    "bg-camfit-green text-camfit-dark hover:bg-emerald-400 hover:shadow-lg hover:shadow-emerald-400/20 active:scale-95",
                    variant === "outline" &&
                    "border-2 border-camfit-green text-camfit-green hover:bg-camfit-green/10",
                    variant === "ghost" && "text-gray-500 hover:text-camfit-dark hover:bg-gray-100",
                    className
                )}
                {...props}
            >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {children}
            </button>
        );
    }
);
Button.displayName = "Button";
