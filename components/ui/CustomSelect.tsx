"use client";

import * as React from "react";
import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface CustomSelectProps {
    label: string;
    options: string[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
}

export function CustomSelect({
    label,
    options,
    value,
    onChange,
    placeholder = "선택하세요",
    className
}: CustomSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const selectedLabel = value || placeholder;

    return (
        <div className={cn("space-y-2 relative", className)} ref={containerRef}>
            <label className="text-sm font-bold text-gray-700 block">{label}</label>

            {/* Select Trigger */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "flex h-12 w-full items-center justify-between rounded-xl border bg-white px-4 py-2 text-sm transition-all text-left",
                    isOpen
                        ? "border-camfit-green ring-2 ring-camfit-green/20"
                        : "border-gray-200 hover:border-camfit-green/50",
                    !value && "text-gray-400"
                )}
            >
                <span className="truncate">{selectedLabel}</span>
                <ChevronDown className={cn("w-4 h-4 text-gray-400 transition-transform duration-200", isOpen && "rotate-180")} />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute z-50 mt-1 w-full max-h-60 overflow-auto rounded-xl border border-gray-100 bg-white p-1 shadow-xl animate-in fade-in zoom-in-95 duration-200">
                    {options.map((option) => (
                        <button
                            key={option}
                            type="button"
                            onClick={() => {
                                onChange(option);
                                setIsOpen(false);
                            }}
                            className={cn(
                                "flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm transition-colors mb-0.5 last:mb-0",
                                value === option
                                    ? "bg-camfit-green/10 text-camfit-green font-semibold"
                                    : "text-gray-600 hover:bg-gray-50 hover:text-camfit-green"
                            )}
                        >
                            <span>{option}</span>
                            {value === option && <Check className="w-4 h-4" />}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
